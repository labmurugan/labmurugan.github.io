// Function to check if we're running locally
function isRunningLocally() {
    return window.location.protocol === 'file:';
}

// Function to fetch and parse Excel file
async function fetchPublicationsData() {
    console.log('Attempting to fetch publications data...');
    
    // If we're running locally, prompt the user to select the file
    if (isRunningLocally()) {
        console.log('Running locally - file access is restricted by browsers');
        document.getElementById('file-selector-container').style.display = 'block';
        return []; // Return empty array initially
    }
    
    try {
        // Try to fetch from the Excel file on the server
        let excelPath = '../data/website_data.xlsx';
        
        // Try with different path options if needed
        const response = await fetch(excelPath);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            // Try an alternative path
            excelPath = 'data/website_data.xlsx';
            const altResponse = await fetch(excelPath);
            if (!altResponse.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return parseExcel(await altResponse.arrayBuffer());
        }
        
        const excelData = await response.arrayBuffer();
        console.log('Excel data received, byte length:', excelData.byteLength);
        
        return parseExcel(excelData);
    } catch (error) {
        console.error('Error fetching Excel:', error);
        if (isRunningLocally()) {
            document.getElementById('file-selector-container').style.display = 'block';
        }
        return [];
    }
}

// Parse Excel data into an array of objects
function parseExcel(excelData) {
    try {
        // Parse the Excel data using SheetJS
        const workbook = XLSX.read(excelData, { type: 'array' });
        
        // Get the Publication Descriptions sheet specifically
        const pubSheetName = 'publication_descriptions';
        
        if (!workbook.Sheets[pubSheetName]) {
            console.error(`Sheet "${pubSheetName}" not found in Excel file`);
            return [];
        }
        
        const pubSheet = workbook.Sheets[pubSheetName];
        
        // Convert to JSON
        const publications = XLSX.utils.sheet_to_json(pubSheet);
        
        console.log('Parsed publications count:', publications.length);
        return publications;
    } catch (error) {
        console.error('Error parsing Excel data:', error);
        return [];
    }
}

// Function to handle manual file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const publications = parseExcel(data);
                renderPublications(publications);
                document.getElementById('loading-message').style.display = 'none';
            } catch (error) {
                console.error('Error processing file:', error);
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('loading-message').style.display = 'none';
            }
        };
        reader.onerror = function() {
            console.error('Error reading file');
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('loading-message').style.display = 'none';
        };
        reader.readAsArrayBuffer(file);
    }
}

// Function to generate HTML for a single publication
function generatePublicationHTML(pub) {
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

// Function to group publications by year
function groupPublicationsByYear(publications) {
    const grouped = {};
    
    publications.forEach(pub => {
        const year = pub.year;
        if (!grouped[year]) {
            grouped[year] = [];
        }
        grouped[year].push(pub);
    });
    
    return grouped;
}

// Function to render publications to the page
function renderPublications(publications) {
    console.log(`Rendering ${publications.length} publications`);
    
    // Get the container element
    const container = document.getElementById('publications-container');
    if (!container) {
        console.error('Container element not found');
        return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    if (publications.length === 0) {
        container.innerHTML = '<p>No publications found.</p>';
        return;
    }
    
    // Group publications by year
    const publicationsByYear = groupPublicationsByYear(publications);
    console.log(`Grouped publications by year: ${Object.keys(publicationsByYear).length} years`);
    
    // Generate HTML for each year group
    for (const year of Object.keys(publicationsByYear).sort((a, b) => b - a)) {
        const yearPublications = publicationsByYear[year];
        
        const yearSection = document.createElement('div');
        yearSection.className = 'year-section';
        
        const yearHeading = document.createElement('h3');
        yearHeading.className = 'year-heading';
        yearHeading.textContent = year;
        yearSection.appendChild(yearHeading);
        
        const publicationsHTML = yearPublications
            .map(pub => generatePublicationHTML(pub))
            .join('');
        
        yearSection.innerHTML += publicationsHTML;
        container.appendChild(yearSection);
    }
    
    console.log('Publications loaded successfully');
}

// Function to populate the publications page with data
async function populatePublications() {
    try {
        console.log('Starting populatePublications function');
        const publications = await fetchPublicationsData();
        
        // If not empty and not running locally, render publications
        if (publications.length > 0) {
            renderPublications(publications);
            document.getElementById('loading-message').style.display = 'none';
        } else if (!isRunningLocally()) {
            // Show error only if we're not running locally (since local will use file picker)
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('loading-message').style.display = 'none';
        }
    } catch (error) {
        console.error('Error in populatePublications:', error);
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('loading-message').style.display = 'none';
    }
}

// Ensure SheetJS is loaded
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load SheetJS library'));
        document.head.appendChild(script);
    });
}

// Run when the document is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM content loaded, starting publications loading...');
    try {
        await loadSheetJS();
        populatePublications();
    } catch (error) {
        console.error('Error loading required libraries:', error);
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('loading-message').style.display = 'none';
    }
}); 