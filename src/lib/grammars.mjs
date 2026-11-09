/*
 * TextMate grammars for the code blocks Shiki doesn't know. Scopes are picked
 * from the ones the css-variables theme colours (see .prose pre in prose.css).
 */

/** Mantis (github.com/ash-hashtag/mantis), after its Tree-sitter highlight queries. */
export const mantis = {
	name: 'mantis',
	scopeName: 'source.mantis',
	aliases: ['ms'],
	patterns: [
		{ name: 'comment.line.double-slash.mantis', match: '//.*$' },
		{ name: 'comment.block.mantis', begin: '/\\*', end: '\\*/' },
		{
			name: 'string.quoted.double.mantis',
			begin: '"',
			end: '"',
			patterns: [{ name: 'constant.character.escape.mantis', match: '\\\\(u[0-9a-fA-F]{4}|.)' }],
		},
		{ name: 'string.quoted.single.mantis', match: "'(\\\\.|[^'\\\\])'" },
		{ name: 'constant.numeric.mantis', match: '\\b(0x[0-9a-fA-F_]+|\\d[\\d_]*(\\.\\d[\\d_]*)?)\\b' },
		{ name: 'constant.language.boolean.mantis', match: '\\b(true|false)\\b' },
		// macros: `fn #name`, `#name(...)`, and compile-time values `$Struct`, `$name`
		{ name: 'keyword.other.macro.mantis', match: '#[A-Za-z_]\\w*' },
		{ name: 'variable.other.constant.mantis', match: '\\$[A-Za-z_]\\w*' },
		{
			match: '\\b(fn)\\s+([A-Za-z_]\\w*)',
			captures: { 1: { name: 'storage.type.function.mantis' }, 2: { name: 'entity.name.function.mantis' } },
		},
		{ name: 'keyword.control.mantis', match: '\\b(if|elif|else|loop|break|continue|return|match|await|yield)\\b' },
		{
			name: 'storage.modifier.mantis',
			match: '\\b(fn|let|mut|pub|async|type|struct|enum|trait|impl|for|where|extern|use|import|static|const|as)\\b',
		},
		{ name: 'variable.language.this.mantis', match: '\\b(self|Self)\\b' },
		{ name: 'support.type.mantis', match: '\\b([iu](8|16|32|64)|f32|f64|bool|char|Str|StrSlice|[A-Z]\\w*)\\b' },
		{ name: 'entity.name.function.mantis', match: '\\b[a-z_]\\w*(?=\\s*(\\[[^\\]]*\\])?\\s*\\()' },
		// `@r` reads through a reference, `r @= v` writes through it
		{ name: 'keyword.operator.mantis', match: '@=?' },
	],
};

/** What mantisc prints: `error[E0301]: ...`, the marked source line, then note/help. */
export const mantisc = {
	name: 'mantisc',
	scopeName: 'text.mantisc',
	patterns: [
		{ name: 'keyword.other.error.mantisc', match: '^error(\\[E\\d+\\])?(?=:)' },
		{
			match: '^\\s*(=) (note|help|explain)(:)',
			captures: { 1: { name: 'comment.mantisc' }, 2: { name: 'entity.name.function.mantisc' } },
		},
		{ name: 'comment.mantisc', match: '-->|\\||^\\s*\\d+(?=\\s*\\|)' },
		{ name: 'keyword.operator.mantisc', match: '\\^+' },
		{ name: 'string.quoted.mantisc', match: '`[^`]*`' },
	],
};

/** Plain text, named so the packet animation (src/scripts/fx.ts) can race its lanes. */
export const lanes = { name: 'lanes', scopeName: 'text.lanes', patterns: [] };
