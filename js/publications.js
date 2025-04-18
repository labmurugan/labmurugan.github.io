// Function to check if we're running locally
function isRunningLocally() {
    return window.location.protocol === 'file:';
}

// Function to fetch and parse CSV file
async function fetchPublicationsData() {
    console.log('Attempting to fetch publications data...');
    
    // If we're running locally, prompt the user to select the file
    if (isRunningLocally()) {
        console.log('Running locally - file access is restricted by browsers');
        document.getElementById('file-selector-container').style.display = 'block';
        return []; // Return empty array initially
    }
    
    try {
        // Try to fetch from the file on the server
        let csvPath = '../data/publication_descriptions.csv';
        
        // Try with different path options if needed
        const response = await fetch(csvPath);
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
            // Try an alternative path
            csvPath = 'data/publication_descriptions.csv';
            const altResponse = await fetch(csvPath);
            if (!altResponse.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return parseCSV(await altResponse.text());
        }
        
        const csvText = await response.text();
        console.log('CSV data received, length:', csvText.length);
        
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error fetching CSV:', error);
        if (isRunningLocally()) {
            document.getElementById('file-selector-container').style.display = 'block';
        }
        return [];
    }
}

// Parse CSV text into an array of objects
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    console.log('CSV lines count:', lines.length);
    
    if (lines.length < 2) {
        console.error('CSV file has too few lines');
        return [];
    }
    
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    console.log('CSV headers:', headers);
    
    const publications = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) {
            console.log(`Skipping empty line at index ${i}`);
            continue; // Skip empty lines
        }
        
        try {
            // Handle commas within quoted fields
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let char of lines[i]) {
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.replace(/"/g, '').trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.replace(/"/g, '').trim());
            
            // Check if we have the expected number of values
            if (values.length !== headers.length) {
                console.warn(`Line ${i} has ${values.length} values but expected ${headers.length}. Line content: ${lines[i].substring(0, 50)}...`);
            }
            
            const publication = {};
            headers.forEach((header, index) => {
                publication[header] = values[index] || '';
            });
            
            publications.push(publication);
        } catch (error) {
            console.error(`Error parsing line ${i}:`, error, lines[i]);
        }
    }
    
    console.log('Parsed publications count:', publications.length);
    return publications;
}

// Function to handle manual file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            const publications = parseCSV(csvText);
            renderPublications(publications);
            document.getElementById('loading-message').style.display = 'none';
        };
        reader.onerror = function() {
            console.error('Error reading file');
            document.getElementById('error-message').style.display = 'block';
            document.getElementById('loading-message').style.display = 'none';
        };
        reader.readAsText(file);
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

// Run when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, starting publications loading...');
    populatePublications();
}); 