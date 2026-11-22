import { flights, hotels } from './travel-data.mjs';

/**
 * Intérprete GraphQL de alcance académico, sin dependencias de red.
 * Admite consultas (no mutaciones), variables escalares, alias y selección de campos.
 * No pretende implementar todo GraphQL (fragments, directives, introspection, etc.).
 */
export class GraphQLQueryError extends Error {
  constructor(message) { super(message); this.name = 'GraphQLQueryError'; }
}

const schema = {
  Query: { flights: 'Flight', hotels: 'Hotel' },
  Flight: new Set(['id', 'destinationId', 'airline', 'flightNumber', 'origin', 'arrival', 'departureDate', 'returnDate', 'price', 'currency', 'available', 'seatsLeft']),
  Hotel: new Set(['id', 'destinationId', 'name', 'location', 'checkIn', 'checkOut', 'nightlyPrice', 'currency', 'amenities', 'available', 'roomsLeft']),
};

function tokenize(source) {
  if (typeof source !== 'string' || source.trim().length === 0 || source.length > 10_000) {
    throw new GraphQLQueryError('Se requiere una consulta GraphQL válida de hasta 10 KB.');
  }
  const tokens = [];
  let cursor = 0;
  while (cursor < source.length) {
    const rest = source.slice(cursor);
    const whitespace = /^(?:[\s,]+|#[^\r\n]*(?:\r?\n|$))/.exec(rest);
    if (whitespace) { cursor += whitespace[0].length; continue; }
    const match = /^([_A-Za-z][_0-9A-Za-z]*|"(?:[^"\\]|\\["\\/bfnrt])*"|-?\d+(?:\.\d+)?|[{}()!:$=\[\]])/.exec(rest);
    if (!match) throw new GraphQLQueryError(`Sintaxis GraphQL no admitida cerca del carácter ${cursor + 1}.`);
    tokens.push(match[1]);
    cursor += match[0].length;
    if (tokens.length > 250) throw new GraphQLQueryError('La consulta supera el límite de complejidad.');
  }
  tokens.push('<EOF>');
  return tokens;
}

function parse(query) {
  const tokens = tokenize(query);
  let index = 0;
  const peek = () => tokens[index];
  const pop = () => tokens[index++];
  const expect = (token) => {
    if (peek() !== token) throw new GraphQLQueryError(`Se esperaba «${token}» y se encontró «${peek()}».`);
    pop();
  };
  const name = () => {
    if (!/^[_A-Za-z][_0-9A-Za-z]*$/.test(peek()) || peek() === '<EOF>') throw new GraphQLQueryError(`Se esperaba un identificador GraphQL y se encontró «${peek()}».`);
    return pop();
  };
  const value = () => {
    if (peek() === '$') { pop(); return { variable: name() }; }
    const part = pop();
    if (part.startsWith('"')) { try { return JSON.parse(part); } catch { throw new GraphQLQueryError('Cadena GraphQL inválida.'); } }
    if (/^-?\d+(?:\.\d+)?$/.test(part)) return Number(part);
    if (part === 'true') return true;
    if (part === 'false') return false;
    if (part === 'null') return null;
    throw new GraphQLQueryError(`Valor GraphQL no admitido: ${part}.`);
  };
  const args = () => {
    const entries = {};
    if (peek() !== '(') return entries;
    pop();
    if (peek() === ')') throw new GraphQLQueryError('Los argumentos no pueden estar vacíos.');
    while (peek() !== ')') {
      const argName = name(); expect(':');
      if (Object.hasOwn(entries, argName)) throw new GraphQLQueryError(`Argumento duplicado: ${argName}.`);
      entries[argName] = value();
      if (peek() === '<EOF>') throw new GraphQLQueryError('Lista de argumentos sin cerrar.');
    }
    pop();
    return entries;
  };
  const selection = (depth = 0) => {
    if (depth > 3) throw new GraphQLQueryError('La consulta supera la profundidad admitida.');
    expect('{');
    const fields = [];
    while (peek() !== '}') {
      if (peek() === '<EOF>') throw new GraphQLQueryError('Selección GraphQL sin cerrar.');
      const first = name();
      let fieldName = first;
      let alias = first;
      if (peek() === ':') { pop(); fieldName = name(); }
      const fieldArgs = args();
      const children = peek() === '{' ? selection(depth + 1) : null;
      fields.push({ fieldName, alias, args: fieldArgs, children });
      if (fields.length > 50) throw new GraphQLQueryError('Demasiados campos solicitados.');
    }
    expect('}');
    if (fields.length === 0) throw new GraphQLQueryError('La selección GraphQL debe incluir al menos un campo.');
    return fields;
  };
  const definitions = new Map();
  if (peek() !== '{') {
    if (pop() !== 'query') throw new GraphQLQueryError('Esta API mock solo admite operaciones query.');
    if (peek() !== '(' && peek() !== '{') name(); // nombre opcional de operación
    if (peek() === '(') {
      pop();
      while (peek() !== ')') {
        expect('$');
        const variableName = name();
        expect(':');
        const variableType = name();
        if (!['ID', 'String', 'Int', 'Float', 'Boolean'].includes(variableType)) throw new GraphQLQueryError(`Tipo de variable no admitido: ${variableType}.`);
        const required = peek() === '!' ? Boolean(pop()) : false;
        if (definitions.has(variableName)) throw new GraphQLQueryError(`Variable duplicada: ${variableName}.`);
        definitions.set(variableName, { type: variableType, required });
        if (peek() === '<EOF>') throw new GraphQLQueryError('Definición de variables sin cerrar.');
      }
      pop();
    }
  }
  const fields = selection();
  if (peek() !== '<EOF>') throw new GraphQLQueryError('Solo se admite una operación GraphQL por solicitud.');
  return { fields, definitions };
}

function project(rows, selection, type) {
  if (!selection) throw new GraphQLQueryError(`El tipo ${type} requiere seleccionar campos.`);
  for (const field of selection) {
    if (!schema[type].has(field.fieldName)) throw new GraphQLQueryError(`El campo ${type}.${field.fieldName} no existe.`);
    if (field.children) throw new GraphQLQueryError(`El campo ${type}.${field.fieldName} no admite subcampos.`);
    if (Object.keys(field.args).length) throw new GraphQLQueryError(`El campo ${type}.${field.fieldName} no admite argumentos.`);
  }
  return rows.map((row) => Object.fromEntries(selection.map(({ alias, fieldName }) => [alias, row[fieldName]])));
}

/** Devuelve el objeto data que se enviará en el cuerpo JSON GraphQL. */
export function executeGraphQL(query, variables = {}) {
  if (variables === null || typeof variables !== 'object' || Array.isArray(variables)) throw new GraphQLQueryError('Las variables deben ser un objeto JSON.');
  const { fields, definitions } = parse(query);
  for (const [variableName, def] of definitions) {
    const resolved = variables[variableName];
    if (def.required && (resolved === undefined || resolved === null)) throw new GraphQLQueryError(`Falta la variable obligatoria $${variableName}.`);
    if (resolved != null) {
      const valid = def.type === 'Int' ? Number.isInteger(resolved)
        : def.type === 'Float' ? typeof resolved === 'number' && Number.isFinite(resolved)
          : def.type === 'Boolean' ? typeof resolved === 'boolean'
            : typeof resolved === 'string';
      if (!valid) throw new GraphQLQueryError(`Tipo inválido para $${variableName}.`);
    }
  }
  const output = {};
  for (const field of fields) {
    if (!Object.hasOwn(schema.Query, field.fieldName)) throw new GraphQLQueryError(`No existe la consulta Query.${field.fieldName}.`);
    const type = schema.Query[field.fieldName];
    if (Object.keys(field.args).length !== 1 || !Object.hasOwn(field.args, 'destinationId')) {
      throw new GraphQLQueryError(`La consulta ${field.fieldName} requiere destinationId.`);
    }
    const input = field.args.destinationId;
    if (input && typeof input === 'object' && input.variable && !definitions.has(input.variable)) {
      throw new GraphQLQueryError(`La variable $${input.variable} no está definida.`);
    }
    const destinationId = input && typeof input === 'object' && input.variable ? variables[input.variable] : input;
    if (typeof destinationId !== 'string' || !destinationId.trim()) throw new GraphQLQueryError('destinationId debe ser un ID válido.');
    if (Object.hasOwn(output, field.alias)) throw new GraphQLQueryError(`Alias duplicado: ${field.alias}.`);
    output[field.alias] = project((field.fieldName === 'flights' ? flights : hotels).filter((item) => item.destinationId === destinationId), field.children, type);
  }
  return output;
}
