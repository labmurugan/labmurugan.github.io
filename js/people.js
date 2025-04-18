// Function to fetch and parse Excel data using SheetJS (xlsx)
async function loadPeopleData() {
    try {
        // Use the exact filename
        const excelFilename = "website_data.xlsx";
        const encodedFilename = encodeURIComponent(excelFilename);
        
        let excelData = null;
        
        try {
            // Direct fetch with the known filename
            const xlsxResponse = await fetch(`../data/${encodedFilename}`);
            
            if (!xlsxResponse.ok) {
                throw new Error(`Failed to fetch Excel file: ${xlsxResponse.status} ${xlsxResponse.statusText}`);
            }
            
            excelData = await xlsxResponse.arrayBuffer();
        } catch (error) {
            throw new Error(`Could not load the Excel file "${excelFilename}". Error: ${error.message}`);
        }
        
        // Parse the Excel data using SheetJS
        const workbook = XLSX.read(excelData, { type: 'array' });
        
        // Get the Trainees sheet specifically
        const traineesSheetName = 'Trainees';
        
        if (!workbook.Sheets[traineesSheetName]) {
            throw new Error(`Sheet "${traineesSheetName}" not found in Excel file`);
        }
        
        const traineesSheet = workbook.Sheets[traineesSheetName];
        
        // Convert to JSON
        const rawTrainees = XLSX.utils.sheet_to_json(traineesSheet);
        
        // Log raw trainees data
        console.log('Raw Trainees Data:');
        rawTrainees.forEach((trainee, index) => {
            console.log(`Trainee ${index + 1}:`, trainee);
        });
        
        if (rawTrainees.length === 0) {
            throw new Error('No data found in the Trainees sheet');
        }
        
        // Normalize the field names to handle variations
        const trainees = normalizeTraineeData(rawTrainees);
        
        // Log normalized trainees data
        console.log('Normalized Trainees Data:');
        trainees.forEach((trainee, index) => {
            console.log(`Trainee ${index + 1}:`, trainee);
        });
        
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
        
        // Generate HTML
        generatePeopleHTML({
            postdocs: postdocs,
            gradStudents: gradStudents, 
            undergrads: undergrads,
            alumniPostdocs: alumniPostdocs,
            alumniGradStudents: alumniGradStudents,
            alumniUndergrads: alumniUndergrads
        });
    } catch (error) {
        console.error('Error loading Excel data:', error);
        
        // For local testing - generate sample data when running locally
        if (window.location.protocol === 'file:') {
            generateSampleData();
        } else {
            document.getElementById('people-container').innerHTML = `
                <p>Error loading people data. Please try again later.</p>
                <p>Details: ${error.message}</p>
                <p>If testing locally, you may need to use a local web server.</p>
                <p>Make sure the Excel file "website_data.xlsx" is in the data/ folder.</p>
                <button onclick="generateSampleData()">Load Sample Data for Testing</button>
            `;
        }
    }
}

// Helper function to normalize field names in the Excel data
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

// Function to generate HTML for people listings
function generatePeopleHTML(peopleData) {
    const container = document.getElementById('people-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Add Arvind Murugan first
    const principalInvestigator = document.createElement('div');
    
    // Create the PI section without title
    principalInvestigator.innerHTML = `
        <div class="people-list">
            <div class="person">
                <div class="person-content">
                    <img src="../images/placeholder.jpg" alt="Arvind Murugan">
                    <div class="person-info">
                        <h3>Arvind Murugan</h3>
                        <p class="notes">Associate Professor</p>
                        <p class="notes"><a href="../data/cv/MuruganCV.pdf">CV</a></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(principalInvestigator);
    
    // Then load the actual image if not running locally
    if (window.location.protocol !== 'file:') {
        const piImg = principalInvestigator.querySelector('img');
        const basePath = '../data/headshots/';
        const imagePath = basePath + 'murugan_arvind.jpg';
        
        // Try to load the image
        const testImg = new Image();
        testImg.onload = function() {
            piImg.src = imagePath;
        };
        
        testImg.onerror = function() {
            piImg.src = '../data/headshots/placeholder.jpeg';
        };
        
        testImg.src = imagePath;
    }
    
    // Add Postdocs
    if (peopleData.postdocs && peopleData.postdocs.length > 0) {
        const postdocsSection = document.createElement('div');
        postdocsSection.innerHTML = `<h2 class="subsection-title">Postdocs</h2>`;
        
        const postdocsList = document.createElement('div');
        postdocsList.className = 'people-list';
        
        peopleData.postdocs.forEach(postdoc => {
            const personDiv = createPersonElement(postdoc);
            postdocsList.appendChild(personDiv);
        });
        
        postdocsSection.appendChild(postdocsList);
        container.appendChild(postdocsSection);
    }
    
    // Add Graduate Students
    if (peopleData.gradStudents && peopleData.gradStudents.length > 0) {
        const gradStudentsSection = document.createElement('div');
        gradStudentsSection.innerHTML = `<h2 class="subsection-title">Graduate Students</h2>`;
        
        const gradStudentsList = document.createElement('div');
        gradStudentsList.className = 'people-list';
        
        peopleData.gradStudents.forEach(gradStudent => {
            const personDiv = createPersonElement(gradStudent);
            gradStudentsList.appendChild(personDiv);
        });
        
        gradStudentsSection.appendChild(gradStudentsList);
        container.appendChild(gradStudentsSection);
    }
    
    // Add Undergraduates
    if (peopleData.undergrads && peopleData.undergrads.length > 0) {
        const undergradsSection = document.createElement('div');
        undergradsSection.innerHTML = `<h2 class="subsection-title">Undergraduates</h2>`;
        
        const undergradsList = document.createElement('div');
        undergradsList.className = 'people-list';
        
        peopleData.undergrads.forEach(undergrad => {
            const personDiv = createPersonElement(undergrad);
            undergradsList.appendChild(personDiv);
        });
        
        undergradsSection.appendChild(undergradsList);
        container.appendChild(undergradsSection);
    }
    
    // Add Alumni section header
    if ((peopleData.alumniPostdocs && peopleData.alumniPostdocs.length > 0) ||
        (peopleData.alumniGradStudents && peopleData.alumniGradStudents.length > 0) ||
        (peopleData.alumniUndergrads && peopleData.alumniUndergrads.length > 0)) {
        
        // Add spacing and divider before Alumni section
        const alumniDivider = document.createElement('div');
        alumniDivider.style.margin = '50px 0 10px 0';
        alumniDivider.innerHTML = `<hr style="border-top: 1px solid #ccc; margin-bottom: 0px;">`;
        container.appendChild(alumniDivider);
        
        const alumniHeader = document.createElement('div');
        alumniHeader.style.textAlign = 'center';
        alumniHeader.innerHTML = `<h1>Alumni</h1>`;
        container.appendChild(alumniHeader);
        
        // Add horizontal line below Alumni title
        const alumniHeaderDivider = document.createElement('div');
        alumniHeaderDivider.style.margin = '10px 0 30px 0';
        alumniHeaderDivider.innerHTML = `<hr style="border-top: 1px solid #ccc; margin-bottom: 30px;">`;
        container.appendChild(alumniHeaderDivider);
        
        // Add Alumni Postdocs
        if (peopleData.alumniPostdocs && peopleData.alumniPostdocs.length > 0) {
            const alumniPostdocsSection = document.createElement('div');
            alumniPostdocsSection.innerHTML = `<h2 class="subsection-title">Postdoc Alumni</h2>`;
            
            const alumniPostdocsList = document.createElement('div');
            alumniPostdocsList.className = 'people-list';
            
            peopleData.alumniPostdocs.forEach(postdoc => {
                const personDiv = createPersonElement(postdoc);
                alumniPostdocsList.appendChild(personDiv);
            });
            
            alumniPostdocsSection.appendChild(alumniPostdocsList);
            container.appendChild(alumniPostdocsSection);
        }
        
        // Add Alumni Graduate Students
        if (peopleData.alumniGradStudents && peopleData.alumniGradStudents.length > 0) {
            const alumniGradStudentsSection = document.createElement('div');
            alumniGradStudentsSection.innerHTML = `<h2 class="subsection-title">Graduate Student Alumni</h2>`;
            
            const alumniGradStudentsList = document.createElement('div');
            alumniGradStudentsList.className = 'people-list';
            
            peopleData.alumniGradStudents.forEach(gradStudent => {
                const personDiv = createPersonElement(gradStudent);
                alumniGradStudentsList.appendChild(personDiv);
            });
            
            alumniGradStudentsSection.appendChild(alumniGradStudentsList);
            container.appendChild(alumniGradStudentsSection);
        }
        
        // Add Alumni Undergraduates
        if (peopleData.alumniUndergrads && peopleData.alumniUndergrads.length > 0) {
            const alumniUndergradsSection = document.createElement('div');
            alumniUndergradsSection.innerHTML = `<h2 class="subsection-title">Undergraduate Alumni</h2>`;
            
            const alumniUndergradsList = document.createElement('div');
            alumniUndergradsList.className = 'people-list';
            
            peopleData.alumniUndergrads.forEach(undergrad => {
                const personDiv = createPersonElement(undergrad);
                alumniUndergradsList.appendChild(personDiv);
            });
            
            alumniUndergradsSection.appendChild(alumniUndergradsList);
            container.appendChild(alumniUndergradsSection);
        }
    }
}

// Helper function to create a person element
function createPersonElement(person) {
    const div = document.createElement('div');
    div.className = 'person';
    
    const lastName = person['Last name'] || '';
    const firstName = person['First name'] || '';
    
    // Create a consistent placeholder while actual image loads
    const placeholderImg = '../images/placeholder.jpg';
    
    // Generate description from Notes/Awards
    let description = '';
    if (person['Notes/Awards']) {
        description = person['Notes/Awards'];
    }
    
    // Generate shared with text on a separate line
    let sharedWith = '';
    if (person['Shared with']) {
        sharedWith = `w/ ${person['Shared with']}`;
    }
    
    // Generate next job text if available
    let nextJob = '';
    if (person['Next job']?.trim()) {
        nextJob = person['Next job'];
    }
    
    // Generate start date text if available
    let startDate = '';
    if (person['Start date'] && person['End Date']) {
        startDate = `${person['Start date']} - ${person['End Date']}`;
    }else if (person['Start date']) {
        startDate = `${person['Start date']} - `;
    }
    
    // Create a horizontal layout
    div.innerHTML = `
        <div class="person-content">
            <img src="${placeholderImg}" alt="${firstName} ${lastName}" data-src="">
            <div class="person-info">
                <h3>${firstName} ${lastName}</h3>
                ${description ? `<p class="notes">${description}</p>` : ''}
                <!-- Using the next-job class for consistent styling across all secondary information -->
                ${sharedWith ? `<p class="next-job">${sharedWith}</p>` : ''}
                ${startDate ? `<p class="next-job">${startDate}</p>` : ''}
                ${nextJob ? `<p class="next-job">${nextJob}</p>` : ''}
            </div>
        </div>
    `;
    
    // Load the image properly after the element is created
    const img = div.querySelector('img');
    
    // Only attempt to load the actual image if not in local file mode
    if (window.location.protocol !== 'file:') {
        const basePath = '../data/headshots/';
        
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
        
        // Create the filename in lowercase_lowercase.jpg format
        const imagePath = `${basePath}${lastNameLower}_${firstNameLower}.jpg`;
        
        // Log the filename for debugging
        console.log(`Attempting to load image for ${firstName} ${lastName}:`, imagePath);
        
        // Try to load the image
        const testImg = new Image();
        testImg.onload = function() {
            img.src = imagePath;
        };
        
        testImg.onerror = function() {
            img.src = '../data/headshots/placeholder.jpeg';
        };
        
        testImg.src = imagePath;
    }
    
    return div;
}

// Generate sample data for local testing
function generateSampleData() {
    const sampleData = {
        postdocs: [
            {
                'First name': 'John',
                'Last name': 'Smith',
                'Notes/Awards': 'Postdoc (2023-)',
                'Shared with': 'Biology Dept',
                'Next job': 'Assistant Professor, University of Example'
            },
            {
                'First name': 'Jane',
                'Last name': 'Doe',
                'Notes/Awards': 'Postdoc (2022-)',
                'Shared with': 'Chemistry Dept',
                'Next job': ''
            }
        ],
        gradStudents: [
            {
                'First name': 'Alex',
                'Last name': 'Johnson',
                'Notes/Awards': 'Grad student (2021-)',
                'Shared with': '',
                'Next job': ''
            },
            {
                'First name': 'Sarah',
                'Last name': 'Williams',
                'Notes/Awards': 'Grad student (2022-)',
                'Shared with': 'Physics Dept',
                'Next job': 'Industry Research Position'
            }
        ],
        undergrads: [
            {
                'First name': 'Michael',
                'Last name': 'Brown',
                'Notes/Awards': 'Undergrad (2023-)',
                'Shared with': '',
                'Next job': 'Graduate Student, MIT'
            }
        ],
        alumniPostdocs: [
            {
                'First name': 'Emily',
                'Last name': 'Taylor',
                'Notes/Awards': 'Postdoc (2020-2023)',
                'Shared with': '',
                'Next job': 'Assistant Professor, Stanford University',
                'End Date': '2023'
            }
        ],
        alumniGradStudents: [
            {
                'First name': 'David',
                'Last name': 'Wilson',
                'Notes/Awards': 'Grad student (2018-2022)',
                'Shared with': '',
                'Next job': 'Data Scientist, Google',
                'End Date': '2022'
            }
        ],
        alumniUndergrads: [
            {
                'First name': 'Jessica',
                'Last name': 'Lee',
                'Notes/Awards': 'Undergrad (2019-2023)',
                'Shared with': '',
                'Next job': 'PhD Student, Harvard',
                'End Date': '2023'
            }
        ]
    };
    
    generatePeopleHTML(sampleData);
}

// Load people data when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if running locally with file:// protocol
    if (window.location.protocol === 'file:') {
        console.log('Running locally with file:// protocol - using sample data');
        // When running locally with file:// protocol, use sample data
        loadSheetJS().then(() => {
            generateSampleData();
        });
    } else {
        // Normal web server loading
        if (typeof XLSX === 'undefined') {
            // Load SheetJS dynamically
            loadSheetJS().then(() => {
                loadPeopleData();
            });
        } else {
            loadPeopleData();
        }
    }
});

// Helper function to load SheetJS
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = function() {
            resolve();
        };
        script.onerror = function() {
            reject(new Error('Failed to load SheetJS'));
        };
        document.head.appendChild(script);
    });
} 