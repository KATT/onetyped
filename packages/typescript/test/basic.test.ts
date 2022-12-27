import { number, object, record, string, union } from '@onetyped/core'
import ts from 'typescript'
import { expect, test } from 'vitest'
import { fromType, printNode, toTypeNode } from '../src'

const testFromType = (type: string) => {
	const filename = 'test.ts'

	const sourceFile = ts.createSourceFile(
		filename,
		`type T = ${type}`,
		ts.ScriptTarget.Latest,
	)

	const defaultCompilerHost = ts.createCompilerHost({})

	const customCompilerHost: ts.CompilerHost = {
		getSourceFile: (name, languageVersion) => {
			return name === filename ? sourceFile : defaultCompilerHost.getSourceFile(
				name,
				languageVersion,
			)
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		writeFile: () => {},
		getDefaultLibFileName: () => 'lib.d.ts',
		useCaseSensitiveFileNames: () => false,
		getCanonicalFileName: filename => filename,
		getCurrentDirectory: () => '',
		getNewLine: () => '\n',
		getDirectories: () => [],
		fileExists: () => true,
		readFile: () => '',
	}

	const program = ts.createProgram([filename], {}, customCompilerHost)
	const typeChecker = program.getTypeChecker()

	const typeAlias = sourceFile.statements.find((statement) =>
		ts.isTypeAliasDeclaration(statement) && statement.name.text === 'T'
	) as ts.TypeAliasDeclaration

	const testType = typeChecker.getTypeAtLocation(typeAlias)

	return fromType(testType, sourceFile, typeChecker)
}

test('fromType', async () => {
	const node = await testFromType(`{
    name: string & { length: number }
    age?: number
    func: (a: number, b: string) => string
    role: 'admin' | 'user'
    t: [string, number, boolean?]
    d: (a: number, b: string) => string
		literal_string: "literal_string" as const,
		literal_true: true as const,
		literal_false: false as const,
  }`)

	expect(node).toMatchInlineSnapshot(`
		{
		  "shape": {
		    "age": {
		      "typeName": "union",
		      "types": [
		        {
		          "type": "number",
		          "typeName": "number",
		        },
		        {
		          "type": "undefined",
		          "typeName": "undefined",
		        },
		      ],
		    },
		    "d": {
		      "arguments": [
		        {
		          "type": "number",
		          "typeName": "number",
		        },
		        {
		          "type": "string",
		          "typeName": "string",
		        },
		      ],
		      "return": {
		        "type": "string",
		        "typeName": "string",
		      },
		      "typeName": "function",
		    },
		    "func": {
		      "arguments": [
		        {
		          "type": "number",
		          "typeName": "number",
		        },
		        {
		          "type": "string",
		          "typeName": "string",
		        },
		      ],
		      "return": {
		        "type": "string",
		        "typeName": "string",
		      },
		      "typeName": "function",
		    },
		    "literal_string": {
		      "type": "literal_string",
		      "typeName": "literal",
		    },
		    "name": {
		      "typeName": "intersection",
		      "types": [
		        {
		          "type": "string",
		          "typeName": "string",
		        },
		        {
		          "shape": {
		            "length": {
		              "type": "number",
		              "typeName": "number",
		            },
		          },
		          "typeName": "object",
		        },
		      ],
		    },
		    "role": {
		      "typeName": "union",
		      "types": [
		        {
		          "type": "admin",
		          "typeName": "literal",
		        },
		        {
		          "type": "user",
		          "typeName": "literal",
		        },
		      ],
		    },
		    "t": {
		      "typeName": "tuple",
		      "types": [
		        {
		          "type": "string",
		          "typeName": "string",
		        },
		        {
		          "type": "number",
		          "typeName": "number",
		        },
		        {
		          "typeName": "union",
		          "types": [
		            {
		              "type": "boolean",
		              "typeName": "boolean",
		            },
		            {
		              "type": "undefined",
		              "typeName": "undefined",
		            },
		          ],
		        },
		      ],
		    },
		  },
		  "typeName": "object",
		}
	`)
})

test('fromType record', async () => {
	const node = await testFromType(`{ name:string } & Record<string, string>`)

	expect(node).toMatchInlineSnapshot(`
		{
		  "typeName": "intersection",
		  "types": [
		    {
		      "shape": {
		        "name": {
		          "type": "string",
		          "typeName": "string",
		        },
		      },
		      "typeName": "object",
		    },
		    {
		      "key": {
		        "type": "string",
		        "typeName": "string",
		      },
		      "typeName": "record",
		      "value": {
		        "type": "string",
		        "typeName": "string",
		      },
		    },
		  ],
		}
	`)
})

test('toTypeNode', () => {
	const personSchema = object({
		name: string(),
		items: record(union([string(), number()]), number()),
	})

	const typeNode = toTypeNode(personSchema)

	expect(printNode(typeNode)).toMatchInlineSnapshot(`
		"{
		    name: string;
		    items: Record<string | number, number>;
		}"
	`)
})

test('fromType literal', async () => {
	const node = await testFromType(`{
		literal_true: true,
		literal_false: false,
		literal_void: void,
  }`)

	expect(node).toMatchInlineSnapshot(`
		{
		  "shape": {
		    "literal_false": {
		      "type": false,
		      "typeName": "literal",
		    },
		    "literal_true": {
		      "type": true,
		      "typeName": "literal",
		    },
		    "literal_void": {
		      "type": "void",
		      "typeName": "void",
		    },
		  },
		  "typeName": "object",
		}
	`)
})

test('recursive', async () => {
	const node = await testFromType(`{
		name: string,
    age: T,
  }`)

	expect(node).toMatchInlineSnapshot()
})
