# Murugan Lab Website

This is a simplified version of the Murugan Lab website, migrated from the original Weebly-based site. The new website uses basic HTML, CSS, and JavaScript for a lightweight, responsive design.

## Structure

- `index.html` - The main homepage
- `css/style.css` - Main stylesheet for the entire website
- `js/main.js` - JavaScript functionality
- `js/people.js` - Script to load people data from Excel spreadsheet
- `js/publications.js` - Script to load publication descriptions from Excel spreadsheet
- `data/website_data.xlsx` - Excel file containing people data and publication descriptions
- `data/headshots/` - Directory for team member profile photos
- `images/` - Directory for all website images
- `pages/` - Directory containing all other pages:
  - `people.html` - Team members page
  - `publications.html` - Research publications
  - `pub_descriptions.html` - Detailed publication descriptions
  - `contact.html` - Contact information
  - `teaching.html` - Teaching information

## How to Update Content

### People

The People page automatically loads data from an Excel spreadsheet:

1. Edit the `data/website_data.xlsx` file to add/update team members
2. The Excel file must have a sheet named "Trainees" with these columns:
   - First name, Last name: Person's name
   - Postdoc/Grad/Undergrad: Use "P" for postdocs, "G" for graduate students, "U" for undergraduates
   - End Date: Should be blank for current trainees, add date for alumni
   - Notes/Awards: Additional information to display
   - Shared with: If the trainee is shared with another lab/department
   - Next job: For alumni, their position after the lab

3. Add profile photos to `data/headshots/` following the naming convention:
   - Format: `lastname_firstname.jpg` or `lastname_firstname.png` (all lowercase)
   - Example: `smith_john.jpg`

### Publications

There are two publication pages:

1. **Google Scholar link** 
   - 'All publications' link in every header goes to Google Scholar, sorted by date

2. **Publication Descriptions** (`pages/pub_descriptions.html`):
   - Automatically loads data from the "publication_descriptions" sheet in `data/website_data.xlsx`
   - To update, edit the Excel sheet with these columns:
     - `title`: Publication title
     - `authors`: Author names
     - `journal`: Journal/conference name
     - `year`: Publication year
     - `url`: Link to the publication
     - `tags`: Tags for categorizing the paper (e.g., `[Bio]`, `[Learning]`)
     - `description`: Detailed description of the publication

### Adding Images

1. Add image files to the `images/` directory
2. Reference them in HTML using:
   ```html
   <img src="images/image_name.jpg" alt="Description">
   ```
3. Example uses: origami_header, U Chicago logo

### Updating the Homepage

The homepage content is in `index.html`. You can update the main heading, research areas, and featured publications there.

## Customization

### Colors and Typography

The main styles are defined in `css/style.css`. To update the visual design:

- Change colors by editing the color values (e.g., `#333`, `#0066cc`)
- Modify font styles by updating the font-family, font-size, and other typography properties
- Adjust spacing with margin and padding properties

### Layout

The website uses CSS Grid and Flexbox for layout. To modify:

- Change column layouts by updating the grid-template-columns properties
- Adjust responsive breakpoints in the @media queries

## Deployment

To deploy this website:

1. Upload all files and directories to your web hosting service
2. Ensure the directory structure is maintained
3. Test all links and functionality

## Local Testing

There are two options for testing the website locally:

### Option 1: Use the included local web server

The repository includes a simple Node.js web server for local testing:

```bash
# Install dependencies (first time only)
npm install

# Run the local server
node local-server.js
```

Then open your browser to http://localhost:8000

### Option 2: Open files directly in browser

The website is also configured with fallback data for direct local testing:

1. Simply open the `index.html` file directly in your browser.
2. For the People page, sample data will be displayed because Excel files cannot be loaded locally via JavaScript due to browser security restrictions.

## Troubleshooting

If you see "Error loading people data" or "Error loading publication data" when testing locally, it's likely due to one of these issues:

1. You're opening files directly with the file:// protocol (use a web server instead)
2. The Excel file couldn't be found (check the filename and path)
3. The required sheet is missing from the Excel file ("Trainees" for people data, "publication_descriptions" for publication data)
4. CORS restrictions (use the local web server)

### Excel Inspection Utility

If you encounter issues with the people data, use the included script to inspect the Excel file:

```bash
cd scripts
node inspect-excel.js
```

This utility will show the structure of your Excel file and help identify any issues. 