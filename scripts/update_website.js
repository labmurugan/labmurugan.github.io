#!/usr/bin/env node

/**
 * Static Website Generator
 * 
 * This script reads data from the Excel file and generates static HTML pages.
 * It generates:
 * 1. Static people.html page
 * 2. Static pub_descriptions.html page
 * 
 * Usage: node update_website.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Constants
const EXCEL_PATH = path.join(__dirname, '..', 'data', 'website_data.xlsx');
const PEOPLE_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'people_template.html');
const PUB_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'pub_descriptions_template.html');
const PEOPLE_OUTPUT_PATH = path.join(__dirname, '..', 'pages', 'people.html');
const PUB_OUTPUT_PATH = path.join(__dirname, '..', 'pages', 'pub_descriptions.html');

// Ensure templates directory exists
if (!fs.existsSync(path.join(__dirname, '..', 'templates'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'templates'));
}

// Function to read Excel file
function readExcelFile(filePath) {
    console.log(`Reading Excel file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
    }
    
    try {
        return XLSX.readFile(filePath);
    } catch (error) {
        throw new Error(`Error reading Excel file: ${error.message}`);
    }
}

// Function to normalize people data field names
function normalizeTraineeData(trainees) {
    // Define common field name variations
    const fieldMappings = {
        'First name': ['First name', 'First Name', 'FirstName', 'first name', 'First'],
        'Last name': ['Last name', 'Last Name', 'LastName', 'last name', 'Last'],
        'End Date': ['End Date', 'EndDate', 'end date', 'End','End date'],
        'Postdoc/Grad/Undergrad': ['Postdoc/Grad/Undergrad', 'Type', 'Position', 'Role', 'Category'],
        'Notes/Awards': ['Notes/Awards', 'Notes', 'Awards', 'notes', 'awards', 'Note'],
        'Shared with': ['Shared with', 'Shared With', 'SharedWith', 'shared with', 'Joint with', 'Joint With'],
        'Shared?': ['Shared?', 'Shared'],
        'Next job': ['Next job', 'Next Job', 'NextJob', 'next job'],
        'Start date': ['Start date', 'Start Date', 'StartDate', 'start date', 'Start']
    };

    // Create a map of normalized field names to actual field names
    const fieldMap = {};
    
    // We need to check all rows for field names because some fields might only exist in some rows
    const allFields = new Set();
    trainees.forEach(trainee => {
        Object.keys(trainee).forEach(field => allFields.add(field));
    });
    
    // Map each normalized field name to the actual field name found in the data
    for (const [normalizedName, possibleNames] of Object.entries(fieldMappings)) {
        for (const actualName of possibleNames) {
            if (allFields.has(actualName)) {
                fieldMap[normalizedName] = actualName;
                break;
            }
        }
    }

    // Create normalized data
    const normalized = trainees.map(trainee => {
        const normalized = {};
        
        for (const [normalizedName, actualName] of Object.entries(fieldMap)) {
            if (actualName in trainee) {
                normalized[normalizedName] = trainee[actualName];
            }
        }
        
        return normalized;
    });
    
    return normalized;
}

// Function to generate person HTML element
function createPersonElement(person) {
    const firstName = person['First name'] || '';
    const lastName = person['Last name'] || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const notes = person['Notes/Awards'] || '';
    
    // Handle shared trainees
    const sharedInfo = person['Shared with'] ? `(shared with ${person['Shared with']})` : '';
    
    // Handle photo path - using sophisticated name matching from original code
    // 1. Convert names to lowercase and trim
    let firstNameLower = firstName.toLowerCase().trim();
    let lastNameLower = lastName.toLowerCase().trim();
    
    // 2. Check if last name contains apostrophes, if so use 'irish'
    if (/['`'']+/.test(lastNameLower)) {
        lastNameLower = 'irish';
    } 
    // Otherwise extract the part before any space or hyphen
    else if (/[ \-""]+/.test(lastNameLower)) {
        lastNameLower = lastNameLower.split(/[ \-""]+/)[0].toLowerCase();
    }
    
    // For first name, extract the part before any space, hyphen, or apostrophe
    if (/[ \-'`''""]+/.test(firstNameLower)) {
        firstNameLower = firstNameLower.split(/[ \-'`''""]+/)[0].toLowerCase();
    }
    
    // Create the filename in lastname_firstname.jpg format
    const photoFileName = `${lastNameLower}_${firstNameLower}.jpg`;
    const photoPath = `../data/headshots/${photoFileName}`;
    const placeholderPath = '../data/headshots/placeholder.jpeg';
    
    // For alumni, show next job
    const nextJob = person['Next job'] ? `<p class="next-job">Now: ${person['Next job']}</p>` : '';
    
    return `
        <div class="person">
            <div class="person-content">
                <img src="${photoPath}" alt="${fullName}" onerror="this.src='${placeholderPath}'">
                <div class="person-info">
                    <h3>${fullName}</h3>
                    <p class="notes">${notes} ${sharedInfo}</p>
                    ${nextJob}
                </div>
            </div>
        </div>
    `;
}

// Function to generate publication HTML element
function createPublicationElement(pub) {
    const title = pub.url 
        ? `<a href="${pub.url}" target="_blank">${pub.title}</a>` 
        : pub.title;
    
    return `
    <div class="publication">
        <div class="pub-header">
            <strong>${title}</strong>
        </div>
        <p class="pub-authors">${pub.authors} | <span class="pub-journal">${pub.journal} (${pub.year})</span></p>
        <div class="pub-description">${pub.description}</div>
    </div>
    `;
}

// Function to generate static people.html page
function generatePeoplePage(workbook) {
    console.log('Generating static people.html...');
    
    try {
        // Check if template exists and create if not
        if (!fs.existsSync(PEOPLE_TEMPLATE_PATH)) {
            console.log('Creating people template file...');
            // Create a copy of the current people.html as a template
            if (fs.existsSync(PEOPLE_OUTPUT_PATH)) {
                const currentHtml = fs.readFileSync(PEOPLE_OUTPUT_PATH, 'utf8');
                fs.writeFileSync(PEOPLE_TEMPLATE_PATH, currentHtml);
            } else {
                throw new Error('No people.html file found to use as template');
            }
        }
        
        // Read the template
        let template = fs.readFileSync(PEOPLE_TEMPLATE_PATH, 'utf8');
        
        // Get the Trainees sheet
        const traineesSheetName = 'Trainees';
        if (!workbook.Sheets[traineesSheetName]) {
            throw new Error(`Sheet "${traineesSheetName}" not found in Excel file`);
        }
        
        const traineesSheet = workbook.Sheets[traineesSheetName];
        const rawTrainees = XLSX.utils.sheet_to_json(traineesSheet);
        
        if (rawTrainees.length === 0) {
            throw new Error('No data found in the Trainees sheet');
        }
        
        // Normalize the field names
        const trainees = normalizeTraineeData(rawTrainees);
        
        // Filter for current trainees (blank end date)
        const currentTrainees = trainees.filter(trainee => 
            !trainee['End Date'] || trainee['End Date'] === '');
            
        // Filter for alumni (trainees with end dates)
        const alumni = trainees.filter(trainee => 
            trainee['End Date'] && trainee['End Date'] !== '');
        
        // Organize current trainees by category
        const postdocs = currentTrainees.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'P');
        
        const gradStudents = currentTrainees.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'G');
        
        const undergrads = currentTrainees.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'U');
            
        // Organize alumni by category
        const alumniPostdocs = alumni.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'P');
        
        const alumniGradStudents = alumni.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'G');
        
        const alumniUndergrads = alumni.filter(trainee => 
            trainee['Postdoc/Grad/Undergrad'] === 'U');
        
        // Generate HTML content
        let peopleHTML = `
        <div id="people-container">
            <!-- Principal Investigator -->
            <div class="people-list">
                <div class="person">
                    <div class="person-content">
                        <img src="../data/headshots/murugan_arvind.jpg" alt="Arvind Murugan" onerror="this.src='../data/headshots/placeholder.jpeg'">
                        <div class="person-info">
                            <h3>Arvind Murugan</h3>
                            <p class="notes">Associate Professor</p>
                            <p class="notes"><a href="../data/cv/MuruganCV.pdf">CV</a></p>
                        </div>
                    </div>
                </div>
            </div>`;
        
        // Add Postdocs
        if (postdocs.length > 0) {
            peopleHTML += `
            <h2 class="subsection-title">Postdocs</h2>
            <div class="people-list">
                ${postdocs.map(createPersonElement).join('\n')}
            </div>`;
        }
        
        // Add Graduate Students
        if (gradStudents.length > 0) {
            peopleHTML += `
            <h2 class="subsection-title">Graduate Students</h2>
            <div class="people-list">
                ${gradStudents.map(createPersonElement).join('\n')}
            </div>`;
        }
        
        // Add Undergraduates
        if (undergrads.length > 0) {
            peopleHTML += `
            <h2 class="subsection-title">Undergraduates</h2>
            <div class="people-list">
                ${undergrads.map(createPersonElement).join('\n')}
            </div>`;
        }
        
        // Add Alumni
        if (alumniPostdocs.length > 0 || alumniGradStudents.length > 0 || alumniUndergrads.length > 0) {
            peopleHTML += `
            <h2 class="section-title">Alumni</h2>`;
            
            // Alumni Postdocs
            if (alumniPostdocs.length > 0) {
                peopleHTML += `
                <h3 class="subsection-title">Former Postdocs</h3>
                <div class="people-list alumni-list">
                    ${alumniPostdocs.map(createPersonElement).join('\n')}
                </div>`;
            }
            
            // Alumni Grad Students
            if (alumniGradStudents.length > 0) {
                peopleHTML += `
                <h3 class="subsection-title">Former Graduate Students</h3>
                <div class="people-list alumni-list">
                    ${alumniGradStudents.map(createPersonElement).join('\n')}
                </div>`;
            }
            
            // Alumni Undergrads
            if (alumniUndergrads.length > 0) {
                peopleHTML += `
                <h3 class="subsection-title">Former Undergraduates</h3>
                <div class="people-list alumni-list">
                    ${alumniUndergrads.map(createPersonElement).join('\n')}
                </div>`;
            }
        }
        
        peopleHTML += `</div><!-- End people-container -->`;
        
        // Replace the placeholder in the template with the generated HTML
        const finalHTML = template.replace(/<div id="people-container">[\s\S]*?<\/div>/, peopleHTML);
        
        // Remove the script tags that load dynamic data
        const cleanHTML = finalHTML
            .replace(/<script src="..\/js\/people.js"><\/script>/, '');
        
        // Write the final HTML to file
        fs.writeFileSync(PEOPLE_OUTPUT_PATH, cleanHTML);
        console.log(`Static people.html has been generated at ${PEOPLE_OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('Error generating people page:', error);
        throw error;
    }
}

// Function to generate static pub_descriptions.html page
function generatePublicationsPage(workbook) {
    console.log('Generating static pub_descriptions.html...');
    
    try {
        // Check if template exists and create if not
        if (!fs.existsSync(PUB_TEMPLATE_PATH)) {
            console.log('Creating publications template file...');
            // Create a copy of the current pub_descriptions.html as a template
            if (fs.existsSync(PUB_OUTPUT_PATH)) {
                const currentHtml = fs.readFileSync(PUB_OUTPUT_PATH, 'utf8');
                fs.writeFileSync(PUB_TEMPLATE_PATH, currentHtml);
            } else {
                throw new Error('No pub_descriptions.html file found to use as template');
            }
        }
        
        // Read the template
        let template = fs.readFileSync(PUB_TEMPLATE_PATH, 'utf8');
        
        // Get the Publications sheet
        const pubSheetName = 'publication_descriptions';
        if (!workbook.Sheets[pubSheetName]) {
            throw new Error(`Sheet "${pubSheetName}" not found in Excel file`);
        }
        
        const pubSheet = workbook.Sheets[pubSheetName];
        const publications = XLSX.utils.sheet_to_json(pubSheet);
        
        if (publications.length === 0) {
            throw new Error('No data found in the publication_descriptions sheet');
        }
        
        // Group publications by year
        const publicationsByYear = {};
        publications.forEach(pub => {
            const year = pub.year;
            if (!publicationsByYear[year]) {
                publicationsByYear[year] = [];
            }
            publicationsByYear[year].push(pub);
        });
        
        // Generate HTML content
        let pubHTML = `
        <div id="publications-container">`;
        
        // Add publications by year, sorted by newest first
        for (const year of Object.keys(publicationsByYear).sort((a, b) => b - a)) {
            const yearPublications = publicationsByYear[year];
            
            pubHTML += `
            <div class="year-section">
                <h3 class="year-heading">${year}</h3>
                ${yearPublications.map(createPublicationElement).join('\n')}
            </div>`;
        }
        
        pubHTML += `
        </div><!-- End publications-container -->`;
        
        // Remove any loading, error, or file selector elements
        template = template
            .replace(/<div id="loading-message">[\s\S]*?<\/div>/, '')
            .replace(/<div id="file-selector-container">[\s\S]*?<\/div>/, '')
            .replace(/<div id="error-message">[\s\S]*?<\/div>/, '');
        
        // Replace the placeholder in the template with the generated HTML
        const finalHTML = template.replace(/<div id="publications-container">[\s\S]*?<\/div>/, pubHTML);
        
        // Remove the script tags that load dynamic data
        const cleanHTML = finalHTML
            .replace(/<script src="..\/js\/publications.js"><\/script>/, '')
            .replace(/<script>[\s\S]*?document\.addEventListener[\s\S]*?<\/script>/, '');
        
        // Write the final HTML to file
        fs.writeFileSync(PUB_OUTPUT_PATH, cleanHTML);
        console.log(`Static pub_descriptions.html has been generated at ${PUB_OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('Error generating publications page:', error);
        throw error;
    }
}

// Main function
async function main() {
    console.log('Starting static website generation...');
    
    try {
        // Read Excel file
        const workbook = readExcelFile(EXCEL_PATH);
        
        // Generate static pages
        generatePeoplePage(workbook);
        generatePublicationsPage(workbook);
        
        console.log('Static website generation completed successfully!');
    } catch (error) {
        console.error('Error generating static website:', error);
        process.exit(1);
    }
}

// Run the main function
main(); 