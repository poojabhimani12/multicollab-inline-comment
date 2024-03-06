// ACF Blocks Commenting features
export default class ACFBlocks extends React.Component {
    constructor(props) {
        super(props);
        this.acfBlocks = this.acfBlocks.bind(this);

    }

    /**
     * ACF Blocks handler
     * 
     * Handles ACF blocks during render
     */
    acfBlocks(currentTime, block) {
        var $currentElement = jQuery('[datatext="' + currentTime + '"]');
        var $currentBlock = $currentElement.closest('[class^="block_"]');
        var acfClasses = $currentElement.parent().prop('className').split(' ');

        // Remove spaces from class names and filter out empty class
        acfClasses = acfClasses.map(function (className) {
            return className.trim();
        }).filter(function (className) {
            return className !== '';
        });

        // Find common class among all elements in the block
        var commonClass = null;
        for (var i = 0; i < acfClasses.length; i++) {
            var currentClass = acfClasses[i];
            if ($currentBlock.find('.' + currentClass).length > 0) {
                commonClass = currentClass;
                break;
            }
        }

        if (commonClass !== null) {
            var index = $currentBlock.find('.' + commonClass).index($currentElement.parent());
        }

        var blockAttributes = wp.data.select('core/block-editor').getBlockAttributes(block.clientId);

        var finalContent = jQuery('[datatext="' + currentTime + '"]').parent().html();
        finalContent = finalContent.trim();

        var finalContentWithoutMdSpan = finalContent.replace(/<mdspan[^>]*>(.*?)<\/mdspan>/g, '$1');

        // Check if any data attribute needs to be updated
        var updateNeeded = false;

        // Create a copy of the block attributes to avoid direct mutation
        const updatedAttributes = {
            data: {
                ...blockAttributes.data,
            },
        };

        // Flatten the object structure
        const flattenObject = (obj, path = []) => {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                const newPath = path.concat(key);
                if (typeof value === 'object' && value !== null) {
                    acc = acc.concat(flattenObject(value, newPath));
                } else {
                    acc.push({ path: newPath.join('.'), value });
                }
                return acc;
            }, []);
        };

        // Check for more than one occurrence of the attribute value (including nested attributes)
        const isMultipleOccurrence = (flattenedAttributes, targetValue) => {
            const occurrences = flattenedAttributes.filter(({ value }) => {
                if (typeof value === 'string' || (value && typeof value === 'object' && value.constructor === String)) {
                    const attributeWithoutHtmlTags = value.replace(/<[^>]*>/g, '').toLowerCase();
                    const finalContentWithoutHtmlTags = targetValue.replace(/<[^>]*>/g, '').toLowerCase();
                    return attributeWithoutHtmlTags.trim() === finalContentWithoutHtmlTags.trim();
                }
                return false;
            });

            return occurrences.length > 1;
        };

        const updatedAttributesData = updatedAttributes.data; // Assuming updatedAttributes is an object with a 'data' property
        const flattenedAttributes = flattenObject(updatedAttributesData);
        const isMultipleOccurrences = isMultipleOccurrence(flattenedAttributes, finalContentWithoutMdSpan);

        // Update block attributes based on conditions
        for (const key in updatedAttributes.data) {
            if (updatedAttributes.data.hasOwnProperty(key)) {
                const attributeValue = updatedAttributes.data[key];

                // Check if attributeValue is not null or undefined and is a string
                if (typeof attributeValue === 'string' || (attributeValue && typeof attributeValue === 'object' && attributeValue.constructor === String)) {

                    // Use a case-insensitive, partial comparison without removing specific HTML tags
                    const attributeWithoutHtmlTags = attributeValue.replace(/<[^>]*>/g, '').toLowerCase();
                    const finalContentWithoutHtmlTags = finalContentWithoutMdSpan.replace(/<[^>]*>/g, '').toLowerCase();

                    // Use strict equality check to compare
                    if (attributeWithoutHtmlTags.trim() === finalContentWithoutHtmlTags.trim()) {
                        // Check conditions and update the attribute accordingly
                        if (isMultipleOccurrences) {
                            if (key.includes(index.toString())) {
                                // Update the attribute with the final content value

                                const matchnum = key.match(/(\d+)_/);
                                const numericValue = matchnum ? matchnum[1] : null;
                                const matchResult = key.match(/\d+_(.+)/);
                                const dataName = matchResult ? matchResult[1] : key;
                                const selector = key.startsWith('field_') ? `[data-key="${key}"]` : `[data-name="${dataName}"]`;
                                const $inputField = jQuery(`${selector} input[type="text"][id*="row-${numericValue}"], ${selector} textarea[id*="row-${numericValue}"]`);
                                $inputField.val(finalContent);

                                updatedAttributes.data[key] = finalContent;
                                updateNeeded = true;
                            }
                        } else if (!isMultipleOccurrences) {
                            // Update the attribute with the final content value (no special condition)

                            const matchnum = key.match(/(\d+)_/);
                            const numericValue = matchnum ? matchnum[1] : null;
                            const matchResult = key.match(/\d+_(.+)/);
                            const dataName = matchResult ? matchResult[1] : key;
                            
                            let selector = key.startsWith('field_') ? `[data-key="${key}"]` : `[data-name="${dataName}"]`;
                            if (numericValue !== null) {
                                selector += `${selector} input[type="text"][id*="row-${numericValue}"], ${selector} textarea[id*="row-${numericValue}"]`;
                            } else {
                                selector += `${selector} input[type="text"], ${selector} textarea`;
                            }

                            const $inputField = jQuery(selector);
                            $inputField.val(finalContent);

                            updatedAttributes.data[key] = finalContent;
                            updateNeeded = true;
                        }
                    }
                } else if (typeof attributeValue === 'object' && attributeValue !== null) {
                    // Check nested attributes
                    const nestedUpdateNeeded = findAndSaveNestedAttributes(attributeValue, finalContent, finalContentWithoutMdSpan, isMultipleOccurrences, index);
                    updateNeeded = updateNeeded || nestedUpdateNeeded;
                }
            }
        }

        // Update block attributes if needed
        if (updateNeeded) {
            wp.data.dispatch('core/block-editor').updateBlockAttributes(block.clientId, updatedAttributes);
        }
    }
}

/**
 * Recursively checks nested block attributes for markdown content to replace. 
 * Updates attributes in place with final content strings.
 * 
 * @param {Object} attributes - The block attributes object to check
 * @param {string} finalContent - The final content string to set 
 * @param {string} finalContentWithoutMdSpan - Final content string without markdown spans
 * @param {boolean} isMultipleOccurrences - Whether multiple occurrences exist
 * @param {number} [targetIndex] - Index of target occurrence to update 
 * @returns {boolean} Whether any nested attributes were updated
 */
function findAndSaveNestedAttributes(attributes, finalContent, finalContentWithoutMdSpan, isMultipleOccurrences, targetIndex) {
    let nestedUpdateNeeded = false;
    let currentIndex = 0;

    function recursiveSearch(obj, currentPath) {
        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const newPath = currentPath ? `${currentPath}.${key}` : key;

                if (typeof value === 'string' || (value && typeof value === 'object' && value.constructor === String)) {
                    const attributeWithoutHtmlTags = value.replace(/<[^>]*>/g, '').toLowerCase();
                    const finalContentWithoutHtmlTags = finalContentWithoutMdSpan.replace(/<[^>]*>/g, '').toLowerCase();

                    if (attributeWithoutHtmlTags.trim() === finalContentWithoutHtmlTags.trim()) {
                        if (currentIndex === targetIndex && isMultipleOccurrences) {
                            // Update the attribute with the final content value

                            const selector = key.startsWith('field_') ? `[data-key="${key}"]` : `[data-name="${key}"]`;
                            const $inputField = jQuery(`${selector} input[type="text"][id*="${currentPath}"], ${selector} textarea[id*="${currentPath}"]`);
                            $inputField.val(finalContent);

                            obj[key] = finalContent;
                            nestedUpdateNeeded = true;
                            return true; // Stop further processing
                        }
                        currentIndex++;
                        if (!isMultipleOccurrences) {
                            // Update the attribute with the final content value

                            const selector = key.startsWith('field_') ? `[data-key="${key}"]` : `[data-name="${key}"]`;
                            const $inputField = jQuery(`${selector} input[type="text"][id*="${currentPath}"], ${selector} textarea[id*="${currentPath}"]`);
                            $inputField.val(finalContent);
                            
                            obj[key] = finalContent;
                            nestedUpdateNeeded = true;
                            return true; // Stop further processing
                        }
                    }
                } else if (Array.isArray(value)) {
                    // Handle array elements recursively
                    for (let i = 0; i < value.length; i++) {
                        const result = recursiveSearch(value[i], newPath);
                        if (result) {
                            return true; // Stop further processing
                        }
                    }
                } else if (typeof value === 'object' && value !== null) {
                    // Recursive call for nested attributes
                    const result = recursiveSearch(value, newPath);
                    if (result) {
                        return true; // Stop further processing
                    }
                }
            }
        }
        return false; // Continue processing
    }
    recursiveSearch(attributes, '');
    return nestedUpdateNeeded;
}
