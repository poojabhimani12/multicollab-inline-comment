import React from 'react'
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import allowedBlocks from './allowedBlocks';
import NonTextComments from './nonTextComments';

const { __ } = wp.i18n;                                                   // eslint-disable-line
const { isKeyboardEvent, displayShortcut } = wp.keycodes;
const { Fragment, useState } = wp.element;       					      // eslint-disable-line
const { BlockControls } = wp.blockEditor;                                 // eslint-disable-line
const { ToolbarGroup, ToolbarButton } = wp.components;                   // eslint-disable-line
const { addFilter } = wp.hooks;                                         // eslint-disable-line
const { createHigherOrderComponent, compose } = wp.compose;             // eslint-disable-line
const { getBlockType } = wp.data.select('core/blocks'); 			    // eslint-disable-line
const $ = jQuery;                                                       // eslint-disable-line
let isRichClassExist = document.activeElement.classList.contains('rich-text');     // eslint-disable-line 
const { useDispatch, useSelector } = wp.data;
const NonTextComment = new NonTextComments();

/**
 * Creates a higher order component that adds block controls
 * for adding comments to blocks that are not text blocks.
 * 
 * Checks if the block is allowed for comments and wraps the 
 * original component in a fragment with block controls for
 * toggling comment mode. Dispatches actions to update comment
 * mode in the store.
 * 
 * @param {Function} BlockEdit Original block edit component.
 * @returns {Function} Wrapped block edit component.
 */
const nonTextBlock = createHigherOrderComponent(BlockEdit => {
	return (props) => {

		const {
			name,
			attributes,
			isSelected,
		} = props;

		var prefixAcf = 'acf/';
		if (props.name.startsWith(prefixAcf)) {

			var selection = window.getSelection();
			if (selection) {
				var anchorOffset = selection.anchorOffset;
				var datatextValue = selection.anchorNode;

				if ((null !== datatextValue && anchorOffset == 0) || props.attributes.datatext) {
					const [isActive, setIsActive] = useState(true);
					wp.data.dispatch('mdstore').setIsActive(true);
				} else {
					const [isActive, setIsActive] = useState(false);
					wp.data.dispatch('mdstore').setIsActive(false);
				}
			} else {
				const [isActive, setIsActive] = useState(false);
				wp.data.dispatch('mdstore').setIsActive(false);
			}

		} else {
			const [isActive, setIsActive] = (props.attributes.datatext) ? useState(true) : useState(false);
			if (props.attributes.datatext) { wp.data.dispatch('mdstore').setIsActive(true) } else { wp.data.dispatch('mdstore').setIsActive(false) };
		}

		let isEditingTemplate = wp.data.select('core/edit-post').isEditingTemplate();

		//const {datatext} = attributes;
		if ((allowedBlocks.text).includes(props.name) || isRichClassExist) {
			return (

				<BlockEdit  {...props} />

			);
		}
		var focusedElement = document.activeElement.localName;
		if ('core/gallery' === name) {
			var isGalleryImageExist = props.attributes.images.length;
		}
		return (

			<Fragment>

				<BlockEdit {...props} />
				{isSelected && (!(allowedBlocks.text).includes(props.name) && ('figcaption' !== focusedElement) && 'yoast-seo/breadcrumbs' !== props.name &&
					!(allowedBlocks.excluded).includes(props.name)) && !isEditingTemplate && !isRichClassExist
					&&
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								icon="admin-comments"
								isActive={wp.data.select('mdstore').getIsActive()}
								label={__('Comment')}
								onClick={NonTextComment.onToggleNonTextBlock}
								shortcut={displayShortcut.primaryAlt('m')}
								className={`toolbar-button-with-nontext toolbar-button__${props.name}`}
								onChange={e => props.setAttributes({ datatext: currentTime })}
							/>
						</ToolbarGroup>
					</BlockControls>
				}
			</Fragment>
		);
	};
}, 'nonTextBlock');

export default compose()(nonTextBlock);
