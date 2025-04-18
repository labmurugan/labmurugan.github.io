// Simple script to inspect Excel file structure
// Usage: node inspect-excel.js [filename]

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function inspectExcel(filepath) {
    console.log(`Inspecting Excel file: ${filepath}`);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
        console.error(`File not found: ${filepath}`);
        return;
    }
    
    try {
        // Read the Excel file
        const workbook = XLSX.readFile(filepath);
        
        // Show all sheets
        console.log('\nAvailable Sheets:');
        console.log(workbook.SheetNames);
        
        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
            console.log(`\n--- Sheet: ${sheetName} ---`);
            
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, {
                defval: null,  // Use null for empty cells
                blankrows: true  // Include blank rows
            });
            
            if (data.length === 0) {
                console.log('  Sheet is empty');
                return;
            }
            
            // Extract all column names from the header row
            const allColumnNames = getAllHeaderColumns(sheet);
            console.log('  All columns in header row:', allColumnNames);
            
            // Show column names (from first row)
            console.log('  Columns with data:', Object.keys(data[0]));
            
            // Show row count
            console.log(`  Row count: ${data.length}`);
            
            // Sample first row
            console.log('  First row:', data[0]);
            
            // Look for the Notes/Awards and Shared with fields
            const notesField = findField(data[0], ['Notes/Awards', 'Notes', 'Awards', 'Note']);
            const sharedWithField = findField(data[0], ['Shared with', 'Shared With', 'Joint with']);
            
            if (notesField) {
                console.log(`  Found Notes/Awards in column: "${notesField}"`);
            } else {
                console.log('  No Notes/Awards field found');
            }
            
            if (sharedWithField) {
                console.log(`  Found Shared with in column: "${sharedWithField}"`);
            } else {
                console.log('  No Shared with field found');
            }
            
            // Check for postdocs, grads, undergrads
            const typeColumn = findTypesColumn(data);
            
            if (typeColumn) {
                console.log(`  Found type information in column: "${typeColumn}"`);
                
                // Count entries by type
                const counts = {};
                data.forEach(row => {
                    const type = row[typeColumn];
                    counts[type] = (counts[type] || 0) + 1;
                });
                
                console.log('  Type counts:', counts);
                
                // Check for 'P' (postdocs)
                const postdocs = data.filter(row => row[typeColumn] === 'P');
                if (postdocs.length > 0) {
                    console.log(`  Found ${postdocs.length} Postdocs (P)`);
                    console.log('  Sample postdoc:', postdocs[0]);
                }
                
                // Check for end dates to identify current vs past
                const endDateColumn = findEndDateColumn(data);
                
                if (endDateColumn) {
                    console.log(`  Found end date info in column: "${endDateColumn}"`);
                    const current = data.filter(row => !row[endDateColumn] || row[endDateColumn] === '');
                    console.log(`  Current (no end date): ${current.length} entries`);
                    
                    // Check for current postdocs specifically
                    const currentPostdocs = current.filter(row => row[typeColumn] === 'P');
                    console.log(`  Current postdocs: ${currentPostdocs.length}`);
                    
                    if (currentPostdocs.length > 0) {
                        console.log('  Sample current postdoc:');
                        console.log(currentPostdocs[0]);
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('Error inspecting Excel file:', error);
    }
}

// Helper to get ALL column names from the header row, including empty ones
function getAllHeaderColumns(sheet) {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headerColumns = [];
    
    // Get the first row (headers)
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({r: 0, c: C}); // r:0 is first row
        const cellValue = sheet[cellAddress] ? sheet[cellAddress].v : null;
        
        if (cellValue !== null) {
            headerColumns.push(cellValue);
        }
    }
    
    return headerColumns;
}

// Helper to find a field with various possible names
function findField(obj, possibleNames) {
    for (const name of possibleNames) {
        if (name in obj) {
            return name;
        }
    }
    return null;
}

// Helper to find the type column (P/G/U)
function findTypesColumn(data) {
    if (data.length === 0) return null;
    
    const firstRow = data[0];
    
    // Try common column names for position type
    const typeColumnNames = [
        'Postdoc/Grad/Undergrad', 'Type', 'Position', 'Role', 'Category'
    ];
    
    for (const colName of typeColumnNames) {
        if (colName in firstRow) {
            return colName;
        }
    }
    
    // Try to find a column that has P/G/U values
    for (const column of Object.keys(firstRow)) {
        // Sample a few rows to check for P/G/U values
        const sampleSize = Math.min(20, data.length);
        const typeValues = new Set();
        
        for (let i = 0; i < sampleSize; i++) {
            if (i < data.length) {
                const value = data[i][column];
                if (value) typeValues.add(value);
            }
        }
        
        // If we find values like P, G, U, this might be our type column
        if (typeValues.has('P') || typeValues.has('G') || typeValues.has('U')) {
            return column;
        }
    }
    
    return null;
}

// Helper to find the end date column
function findEndDateColumn(data) {
    if (data.length === 0) return null;
    
    const firstRow = data[0];
    
    // Try common column names for end date
    const endDateColumnNames = [
        'End Date', 'EndDate', 'End', 'End Year', 'Completion'
    ];
    
    for (const colName of endDateColumnNames) {
        if (colName in firstRow) {
            return colName;
        }
    }
    
    return null;
}

// Main
const args = process.argv.slice(2);
let filepath;

if (args.length > 0) {
    // Use provided filename
    filepath = path.resolve(args[0]);
} else {
    // Try to find the Excel file automatically
    const files = fs.readdirSync(__dirname);
    const excelFiles = files.filter(file => 
        file.includes('Murugan CV info') && file.endsWith('.xlsx'));
    
    if (excelFiles.length === 0) {
        console.error('No Excel file found. Please specify a filename.');
        process.exit(1);
    }
    
    // Sort by modification time, newest first
    excelFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(__dirname, a));
        const statB = fs.statSync(path.join(__dirname, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
    });
    
    filepath = path.join(__dirname, excelFiles[0]);
}

inspectExcel(filepath); 