const fs = require('fs');

// Read the original file
const originalData = JSON.parse(fs.readFileSync('src/lib/__tests__/fixtures/case-demo-framework.json', 'utf8'));

// Build a map of parent-child relationships from CFAssociations
const parentChildMap = new Map();
const childParentMap = new Map();

originalData.CFAssociations.forEach(association => {
  if (association.associationType === 'isChildOf') {
    const childId = association.originNodeURI.identifier;
    const parentId = association.destinationNodeURI.identifier;
    
    // Add to parent-child map
    if (!parentChildMap.has(parentId)) {
      parentChildMap.set(parentId, []);
    }
    parentChildMap.get(parentId).push(childId);
    
    // Add to child-parent map
    childParentMap.set(childId, parentId);
  }
});

// Function to determine OCX type based on CFItem content
function determineOCXType(cfItem) {
  // If it has CFItemType, it's likely an Activity
  if (cfItem.CFItemType) {
    return 'Activity';
  }
  
  // If it's a simple item with just basic properties, it's likely a LessonGrouping
  if (!cfItem.CFItemType && !cfItem.extensions) {
    return 'LessonGrouping';
  }
  
  // Default to Activity
  return 'Activity';
}

// Function to create OCX node
function createOCXNode(cfItem, ocxType) {
  const baseNode = {
    "@context": ocxType === 'LessonGrouping' 
      ? "https://schema.org/LessonGrouping" 
      : "https://chanzuckerberg.com/Activity",
    "@type": ocxType,
    "name": cfItem.fullStatement,
    "identifier": cfItem.identifier,
    "isPartOf": [],
    "position": 1
  };

  if (ocxType === 'LessonGrouping') {
    baseNode.hasPart = [];
  } else {
    baseNode.description = "Interactive textbook section";
  }

  return baseNode;
}

// Process each CFItem
originalData.CFItems.forEach((cfItem, index) => {
  const ocxType = determineOCXType(cfItem);
  const ocxNode = createOCXNode(cfItem, ocxType);
  
  // Set isPartOf based on parent relationships
  const parentId = childParentMap.get(cfItem.identifier);
  if (parentId) {
    ocxNode.isPartOf = [parentId];
  }
  
  // Set hasPart based on child relationships
  const children = parentChildMap.get(cfItem.identifier);
  if (children && children.length > 0) {
    ocxNode.hasPart = children;
  }
  
  // Add OCX extension to the CFItem
  if (!cfItem.extensions) {
    cfItem.extensions = {};
  }
  cfItem.extensions.ocx = ocxNode;
});

// Write the updated file
fs.writeFileSync(
  'src/lib/__tests__/fixtures/case-demo-framework-with-ocx.json', 
  JSON.stringify(originalData, null, 2)
);

console.log(`Processed ${originalData.CFItems.length} CFItems`);
console.log(`Found ${parentChildMap.size} parent-child relationships`);
console.log('File updated successfully!'); 