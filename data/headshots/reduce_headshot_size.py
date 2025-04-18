from PIL import Image
import os

def compress_image(input_path, output_path, target_size_kb):
    # Open the image (works with both JPG and PNG)
    img = Image.open(input_path)
    
    # Convert to RGB mode if necessary (for PNG with transparency)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
        img = background
    
    # Start with high quality
    quality = 95
    
    # Save the image
    img.save(output_path, format='JPEG', quality=quality)
    
    # Only reduce quality if the file exceeds target size
    if os.path.getsize(output_path) > target_size_kb * 1024:
        while True:
            # Save image with current quality
            img.save(output_path, format='JPEG', quality=quality)
            if os.path.getsize(output_path) <= target_size_kb * 1024:
                break
            quality -= 5  # Reduce quality in steps of 5
            if quality < 10:  # Don't go too low on quality
                print(f"Warning: Could not reduce {os.path.basename(input_path)} below {target_size_kb}KB")
                break

folder_path = '.'  # Change this to your folder path
target_size_kb = 100  # Target file size in KB

for filename in os.listdir(folder_path):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        input_path = os.path.join(folder_path, filename)
        
        # For PNG files, create a JPG output path
        if filename.lower().endswith('.png'):
            output_filename = os.path.splitext(filename)[0] + '.jpg'
            output_path = os.path.join(folder_path, output_filename)
        else:
            output_path = os.path.join(folder_path, filename)
        
        # Skip if file is already under target size (for JPGs only)
        if filename.lower().endswith(('.jpg', '.jpeg')) and os.path.getsize(input_path) <= target_size_kb * 1024:
            print(f'Skipping {filename} (already under {target_size_kb}KB)')
            continue
        
        # Compress the image
        compress_image(input_path, output_path, target_size_kb)
        
        # Delete original PNG file after conversion
        if filename.lower().endswith('.png') and os.path.exists(output_path):
            os.remove(input_path)
            print(f'Converted and compressed {filename} to {output_filename}')
        else:
            print(f'Compressed {filename}')