import type {PrismTheme} from 'prism-react-renderer';

/**
 * Syntax themes for the Persona 4 site theme.
 *
 * Both are built from the same four-role palette so code blocks read as part
 * of the theme rather than as a bolted-on widget:
 *
 *   keyword  -> P4 yellow (the brand colour, carries the most weight)
 *   string   -> Velvet Room blue
 *   literal  -> Inaba red
 *   comment  -> muted, italic, never competing with code
 *
 * Light-mode values are darkened until they clear 4.5:1 on the cream code
 * background; dark-mode values are the saturated originals.
 */

const dark = {
    bg: '#0e0e10',
    fg: '#f2f2ec',
    comment: '#7b7b74',
    keyword: '#ffe100',
    string: '#7fb2ff',
    literal: '#ff7a8a',
    fn: '#ffd166',
    punctuation: '#9a9a92',
    deleted: '#ff5a6e',
    inserted: '#5bd97c',
};

const light = {
    bg: '#fffbe8',
    fg: '#14140f',
    comment: '#6f6a55',
    keyword: '#8c5a00',
    string: '#1f4fa8',
    literal: '#b3122a',
    fn: '#8c6a00',
    punctuation: '#5f5b4c',
    deleted: '#a3101f',
    inserted: '#1f7a37',
};

const build = (c: typeof dark): PrismTheme => ({
    plain: {color: c.fg, backgroundColor: c.bg},
    styles: [
        {
            types: ['comment', 'prolog', 'cdata'],
            style: {color: c.comment, fontStyle: 'italic'},
        },
        {types: ['doctype', 'punctuation', 'entity'], style: {color: c.punctuation}},
        {
            types: ['attr-name', 'class-name', 'boolean', 'constant', 'number'],
            style: {color: c.literal},
        },
        {types: ['keyword', 'atrule', 'rule', 'important'], style: {color: c.keyword, fontWeight: 'bold'}},
        {types: ['operator', 'tag', 'selector', 'symbol'], style: {color: c.keyword}},
        {types: ['property', 'variable'], style: {color: c.fn}},
        {types: ['function', 'function-name'], style: {color: c.fn}},
        {types: ['string', 'char', 'attr-value', 'regex', 'url'], style: {color: c.string}},
        {types: ['builtin', 'namespace'], style: {color: c.literal}},
        {types: ['deleted'], style: {color: c.deleted}},
        {types: ['inserted'], style: {color: c.inserted}},
        {types: ['italic'], style: {fontStyle: 'italic'}},
        {types: ['bold'], style: {fontWeight: 'bold'}},
    ],
});

export const persona4PrismLight = build(light);
export const persona4PrismDark = build(dark);
