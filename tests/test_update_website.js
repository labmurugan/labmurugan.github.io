// Tests for the headshot filename matching in scripts/update_website.js.
// Run with: npm test
//
// Headshots live in data/headshots/ as lastname_firstname.jpg (all lowercase).
// If the generated name doesn't match a file, the page silently falls back to
// the placeholder photo, so these cases guard against that.

const test = require('node:test');
const assert = require('node:assert/strict');
const { headshotFileName } = require('../scripts/update_website.js');

test('simple name is lowercased as lastname_firstname.jpg', () => {
    assert.equal(headshotFileName('Martin', 'Falk'), 'falk_martin.jpg');
});

test('mixed-case names are fully lowercased', () => {
    assert.equal(headshotFileName('HuiYi', 'Mei'), 'mei_huiyi.jpg');
    assert.equal(headshotFileName('LaNijah', 'Flagg'), 'flagg_lanijah.jpg');
});

test('surrounding whitespace is ignored', () => {
    assert.equal(headshotFileName(' Leon ', ' Zhou '), 'zhou_leon.jpg');
});

test('curly apostrophe in last name is stripped', () => {
    // The spreadsheet stores O’Brien with a curly (U+2019) apostrophe
    assert.equal(headshotFileName('Jackson', 'O’Brien'), 'obrien_jackson.jpg');
});

test('straight apostrophe in last name is stripped', () => {
    assert.equal(headshotFileName('Jackson', "O'Brien"), 'obrien_jackson.jpg');
});

test('left curly quote and backtick are stripped too', () => {
    assert.equal(headshotFileName('Jackson', 'O‘Brien'), 'obrien_jackson.jpg');
    assert.equal(headshotFileName('Jackson', 'O`Brien'), 'obrien_jackson.jpg');
});

test('hyphenated last name uses only the first part', () => {
    assert.equal(headshotFileName('Milena', 'Chakraverti-Wuerthwein'), 'chakraverti_milena.jpg');
});

test('two-word last name uses only the first word', () => {
    assert.equal(headshotFileName('Rudy', 'Mendez Reina'), 'mendez_rudy.jpg');
    assert.equal(headshotFileName('Alexandra', 'Carruthers Ferrero'), 'carruthers_alexandra.jpg');
});

test('two-word or hyphenated first name uses only the first part', () => {
    assert.equal(headshotFileName('Mary Ann', 'Smith'), 'smith_mary.jpg');
    assert.equal(headshotFileName('Jean-Luc', 'Smith'), 'smith_jean.jpg');
});

test('apostrophe in first name is stripped, not split on', () => {
    assert.equal(headshotFileName('D’Andre', 'Smith'), 'smith_dandre.jpg');
});

test('apostrophe and hyphen together in last name', () => {
    assert.equal(headshotFileName('Ana', 'O’Neil-Garcia'), 'oneil_ana.jpg');
});

test('empty names do not throw', () => {
    assert.equal(headshotFileName('', ''), '_.jpg');
});
