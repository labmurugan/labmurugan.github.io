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
  - `people.html` - Team members page (statically generated)
  - `publications.html` - Research publications
  - `pub_descriptions.html` - Detailed publication descriptions (statically generated)
  - `contact.html` - Contact information
  - `teaching.html` - Teaching information
- `scripts/` - Directory for utility scripts
  - `update_website.js` - Script to generate static HTML from Excel data
- `templates/` - Directory for HTML templates used by the static site generator

## How to Update Content

### Updating the Website Content

The website uses a static generation approach. To update content:

1. Edit the `data/website_data.xlsx` Excel file with your changes
2. Run the update script to regenerate the static HTML:

```bash
# Run the update script
npm run update
```

3. Push the changes to your web server or GitHub Pages

### People

The People page content is generated from the Excel spreadsheet:

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

4. Run `npm run update` to regenerate the static HTML

### Publications

There are two publication pages:

1. **Google Scholar link** 
   - 'All publications' link in every header goes to Google Scholar, sorted by date

2. **Publication Descriptions** (`pages/pub_descriptions.html`):
   - Content is generated from the "publication_descriptions" sheet in `data/website_data.xlsx`
   - To update, edit the Excel sheet with these columns:
     - `title`: Publication title
     - `authors`: Author names
     - `journal`: Journal/conference name
     - `year`: Publication year
     - `url`: Link to the publication
     - `tags`: Tags for categorizing the paper (e.g., `[Bio]`, `[Learning]`)
     - `description`: Detailed description of the publication
   
   - Run `npm run update` to regenerate the static HTML

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

1. Update your content in the Excel file
2. Run `npm run update` to generate static HTML
3. Test locally using `npm start` to run local server; open browser to localhost:8000
4. Push all files (which ones) to GitHub Pages. Ensure the directory structure is maintained


## Local Testing

There are two options for testing the website locally:

### Option 1: Use the included local web server

The repository includes a simple Node.js web server for local testing:

```bash
# Install dependencies (first time only)
npm install

# Run the local server
npm start
```

Then open your browser to <http://localhost:8000>

### Option 2: Open files directly in browser

Since the website now uses static HTML pages, you can simply open any HTML file directly in your browser without a server.

## Troubleshooting

If you encounter issues with the static generation process:

1. Check that you have Node.js installed (v14 or higher recommended)
2. Verify that the Excel file exists and has the required sheets
3. Run `npm install` to ensure all dependencies are installed
4. Check the error message in the console for specific issues

### Excel Inspection Utility

If you encounter issues with the Excel data, use the included script to inspect the Excel file:

```bash
cd scripts
node inspect-excel.js ../data/website_data.xlsx
```

This utility will show the structure of your Excel file and help identify any issues.
