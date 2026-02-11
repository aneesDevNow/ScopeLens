import xml.etree.ElementTree as ET

# Load the original SVG
svg_path = '/Users/manees/Mac_sync/ScopeLens/file.svg'
ET.register_namespace('', "http://www.w3.org/2000/svg")
ET.register_namespace('xlink', "http://www.w3.org/1999/xlink")
tree = ET.parse(svg_path)
root = tree.getroot()

# Create filter element
filter_elem = ET.Element('filter', {'id': 'purple-filter'})
fe_hue = ET.Element('feColorMatrix', {
    'type': 'hueRotate',
    'values': '100' # Shifts teal to purple
})
filter_elem.append(fe_hue)

# Create a group to hold distinct paths
group = ET.Element('g', {'filter': 'url(#purple-filter)'})

# Move all children of root (except defs if any) to the group
children = list(root)
for child in children:
    root.remove(child)
    group.append(child)

# Add filter and group back to root
root.insert(0, filter_elem)
root.append(group)

# Save as new SVG
out_path = '/Users/manees/Mac_sync/ScopeLens/scopelens-dashboard/public/icons/ai-paraphrased-icon.svg'
tree.write(out_path, encoding='utf-8', xml_declaration=True)
