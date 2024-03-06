import Board from './component/board';
import React from 'react'
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import allowedBlocks from './component/allowedBlocks';
import Mdstore from './mdStore';

import assign from "lodash.assign";
const { __ } = wp.i18n;                                                   // eslint-disable-line
const { isKeyboardEvent, displayShortcut } = wp.keycodes;
const { Fragment, useState } = wp.element;       					      // eslint-disable-line
const { BlockControls } = wp.blockEditor;                                 // eslint-disable-line
const { ToolbarGroup, ToolbarButton } = wp.components;                   // eslint-disable-line
const { addFilter } = wp.hooks;                                         // eslint-disable-line
const { createHigherOrderComponent, compose } = wp.compose;             // eslint-disable-line
const { getBlockType } = wp.data.select('core/blocks'); 			    // eslint-disable-line
const $ = jQuery;                                                       // eslint-disable-line

function onToggleNonTextBlock() {
	var currentTime = Date.now();
	currentTime = 'el' + currentTime;
	var block = wp.data.select('core/block-editor').getSelectedBlock();

	var blockName = block.name;
	var blockType = getBlockType(blockName);
	var commentedOnText = getCommentedText(blockType.name, block);
	var blockIndex = block.clientId;
	var blockId = "block-" + blockIndex;
	var existingDatatext = wp.data.select('core/block-editor').getBlockAttributes(blockIndex).datatext;
	wp.data.dispatch('mdstore').setIsActive(true);

	//Restrict multiple comment on same block
	if (existingDatatext) {
		var noticeMsg = __('Multiple comments are not possible on the same block.', 'content-collaboration-inline-commenting');
		document.getElementById("cf-board__notice").innerHTML = noticeMsg;
		document.getElementById("cf-board__notice").setAttribute('style', 'display:block');
		setTimeout(function () {
			document.getElementById("cf-board__notice").setAttribute('style', 'display:none');
			document.getElementById("cf-board__notice").innerHTML = "";
		}, 3000);
		return;
	}
	if ($("#cf-span__comments").is(':empty')) {
		$('body').addClass("commentOn");
	}
	if ($('body').hasClass('hide-comments')) {
		$('body').removeClass('hide-comments');
	}
	if (false === wp.data.select('mdstore').getShowComments()) {
		wp.data.dispatch('mdstore').setShowComments(true);
		$('.comment-toggle .components-form-toggle').removeClass('is-checked');
		//$('.comment-toggle .components-base-control__help').html('All comments will show on the content area.');
	}

	$("#" + blockId).attr('datatext', currentTime);
	var newNode = document.createElement('div');
	newNode.setAttribute("id", currentTime);
	newNode.setAttribute("class", 'cls-board-outer draftComment cm-board');
	var referenceNode = document.getElementById('cf-span__comments');
	if (null === referenceNode) {
		createCommentNode();
		var referenceNode = document.getElementById('cf-span__comments');

	}

	referenceNode.appendChild(newNode);
	if ('' !== commentedOnText) {
		ReactDOM.render(
			<Board datatext={currentTime} freshBoard={1} commentedOnText={commentedOnText} />,
			document.getElementById(currentTime)
		)
	} else {
		var selectedBlock = __('Please select block/image to comment on.', 'content-collaboration-inline-commenting');
		alert(selectedBlock);

		return;
	}

	if ($('.cf-floating__wrapper').length > 1) {
		removeFloatingIcon();
	}

	$('#cf-span__comments .cls-board-outer').removeClass('focus');
	$('#cf-span__comments .cls-board-outer').removeClass('is-open');
	$('#cf-span__comments .cls-board-outer').css('opacity', '0.4');
	$('#cf-span__comments .cls-board-outer').css('top', 0);
	$('#' + currentTime + '.cls-board-outer').addClass('focus');
	$('#' + currentTime + '.cls-board-outer.focus').css('opacity', '1');
	$('#' + currentTime).offset({ top: $('[datatext="' + currentTime + '"]').offset().top });
	$('#' + currentTime).addClass('has_text').show();
	$('#' + currentTime + '.cls-board-outer').addClass('is-open');
	$('#history-toggle').attr('data-count', $('.cls-board-outer').length);
	//Activate Show All comment button in setting panel
	$('.comment-toggle .components-form-toggle').removeClass('is-checked');
	//$('.comment-toggle .components-base-control__help').html('All comments will show on the content area.');

	wp.data.dispatch('core/block-editor').updateBlock(blockIndex, {
		attributes: {
			datatext: currentTime,
		}
	});

	wp.data.dispatch('mdstore').setDataText(currentTime);

};

// Added for Non Text Block Keyboard Shortcut/@author Meet Mehta/@since EDD - 3.0.1 
window.addEventListener('keydown', function (event) {
	var block = wp.data.select('core/block-editor').getSelectedBlock();
	var focusedElement = document.activeElement.localName;
	if (null !== block) {
		if (!((allowedBlocks.text).includes(block.name) || 'figcaption' === focusedElement)) {
			if (isKeyboardEvent.primaryAlt(event, 'm')) {
				event.preventDefault();
				$(".toolbar-button-with-nontext").trigger('click');
			}
		}
	}
});

/**
 * Gets the text that was commented on for the given block type and block.
 * 
 * @param {string} blockType - The block type.
 * @param {Object} block - The block object.
 * @returns {string} The commented on text.
 */
function getCommentedText(blockType, block) {
	var commentedOnText, url;
	//User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
	if ((allowedBlocks.media).includes(block.name)) {

		if ('core/video' === blockType || 'core/audio' === blockType) {
			url = block.attributes.src;
		} else if ('core/media-text' == blockType) {
			url = block.attributes.mediaUrl;
		} else if ('core/gallery' == blockType) {
			url = block.attributes.images[0].url;
		}
		else {
			url = block.attributes.url;
		}
		if (undefined !== url) {
			var srcText = url.split("/");
			commentedOnText = srcText[srcText.length - 1];

		} else {
			commentedOnText = '';
		}
		return commentedOnText;
	}
	else {
		var commentBlockName = block.name.replace(/[^a-zA-Z0-9]/g, ' ');
		if (!(allowedBlocks.text).includes(block.name)) {
			commentedOnText = __('Content Block', 'content-collaboration-inline-commenting');
		}
		else {
			commentedOnText = commentBlockName.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));

		}
		return commentedOnText;
	}

}

/**
 * Higher order component that adds a new attribute to the wrapped component.
 * 
 * @param {Function} BlockListBlock - The component to wrap.
 * @returns {Function} The wrapped component.
 */
const addNewAttribute = createHigherOrderComponent((BlockListBlock) => {
	return (props) => {

		
		const { attributes } = props;
	
		let newDatatext = (attributes.datatext != undefined || attributes.datatext != '') ? attributes.datatext : '';
		let suggestion_id = (attributes.suggestion_id != undefined || attributes.suggestion_id != '') ? attributes.suggestion_id : '';
		
		console.log('inside 1');
		
		//User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
		if ((allowedBlocks.text).includes(props.name) || (allowedBlocks.widget).includes(props.name)) {
			if(attributes.datatext && attributes?.suggestion_id ){
				return (
					<BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id}} className={'cf-onwhole-block__comment'}/>

				);
			}else if(attributes.datatext ){
				console.log('inside if');
				return (
					<BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true}} className={'cf-onwhole-block__comment'}/>

				);
				//return <BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true}} className={'cf-onwhole-block__comment'} />;
			}else if(attributes.suggestion_id ){
			
				return (
					<BlockListBlock {...props} wrapperProps={{ 'suggestion_id': suggestion_id }} />
				  
				);
			  //return <BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true}} className={'cf-onwhole-block__comment'} />;
		  }else{
				return (<BlockListBlock {...props} />);
			}
			
		} else if(attributes.datatext && attributes?.suggestion_id){
			return (
				<BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id}} className={'cf-onwhole-block__comment'}/>

			);
		}
		
		if(attributes.datatext && attributes?.suggestion_id ){ // For block level suggestion functionality @author / Mayank Jain - @since 3.4 
			return <BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id }} className={'commentIcon'} />;
		
		} else if (attributes.datatext) {	
			return <BlockListBlock {...props} wrapperProps={{ 'datatext': newDatatext, 'data-rich-text-format-boundary': true }} className={'commentIcon'} />;
		
		} else if( attributes?.suggestion_id ) {  // For block level suggestion functionality @author / Mayank Jain - @since 3.4
			return <BlockListBlock {...props} wrapperProps={{ 'suggestion_id': suggestion_id }} />;
	    
		} else {
			return <BlockListBlock {...props} />;
		}
	};
}, 'addNewAttribute');

wp.hooks.addFilter(
	'editor.BlockListBlock',
	'mdComment/add-new-attribute',
	addNewAttribute
);

// To add block suggestion icon and comment icon @author - Mayank / since 3.5
addFilter(
    'editor.BlockListBlock',
    'multicollab/block-suggestion/mc-whole-block-comment',
    ( OriginalComponent ) => ( props ) => {

      const component = <OriginalComponent { ...props } />;
	  let suggestionClass = '', suggestionID = '', blockclientId='';
		if (props.attributes?.className && props.attributes.className.includes('blockAdded')) {
			suggestionClass = 'cf-icon__addBlocks';
		} else if (props.attributes?.className && props.attributes.className.includes('blockremove')) {
			suggestionClass = 'cf-icon__removeBlocks';
		} else {
			suggestionClass = '';
		}
		if ('' !== suggestionClass) {
			suggestionID = props.attributes?.suggestion_id || '';
			blockclientId = props.block?.clientId || '';
		}
      if (props.attributes?.datatext && (allowedBlocks.text).includes(props.name) && '' === suggestionClass) {
		return (
			<div className='cf-wrapperblock__suggestion'>  
			  { component }
			  <span class={'cf-icon-wholeblock__comment'} datatext = {props.attributes.datatext} ></span>
			</div>
		  );
      } else if (props.attributes?.datatext && '' !== suggestionClass){
		if( '1' !== cf_permissions.hide_comment ) {
			return (
				<div className='cf-wrapperblock__suggestion'>  
				  { component }
				  <span class={'cf-icon-wholeblock__comment'} data-blockclient_id={blockclientId} data-suggestion_id={suggestionID} datatext = {props.attributes.datatext}></span>
				</div>
			  );
		} else {
			return (
				<div className='cf-wrapperblock__suggestion'>  
				  { component }
				  <span class={suggestionClass} data-blockclient_id={blockclientId} data-suggestion_id={suggestionID} datatext = {props.attributes.datatext}></span>
				</div>
			  );
		}
		
	  }else if ('' !== suggestionClass){
		return (
			        <div className='cf-wrapperblock__suggestion'>  
			          { component }
			          <span class={suggestionClass} data-blockclient_id={blockclientId} data-suggestion_id={suggestionID}></span>
			        </div>
			      );
	  }else {
        return component;
      }	


    }
);

/**
 * Creates a higher order component that wraps the BlockEdit component
 * to add functionality for non-text blocks.
 * 
 * @param {Function} BlockEdit The original BlockEdit component
 * @returns {Function} Enhanced BlockEdit component
 */
const nonTextBlock = createHigherOrderComponent(BlockEdit => {
	return (props) => {

		const {
			name,
			attributes,
			isSelected,
		} = props;
		const [isActive, setIsActive] = (props.attributes.datatext) ? useState(true) : useState(false);
		let isEditingTemplate = wp.data.select('core/edit-post').isEditingTemplate();
		if (props.attributes.datatext) { wp.data.dispatch('mdstore').setIsActive(true) } else { wp.data.dispatch('mdstore').setIsActive(false) };
		//const {datatext} = attributes;
		if ((allowedBlocks.text).includes(props.name)) {
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
				{isSelected && (!(allowedBlocks.text).includes(props.name) && ('figcaption' !== focusedElement) && 'yoast-seo/breadcrumbs' !== props.name) && ("1" === cf_permissions.add_comment) && !isEditingTemplate
					&&
					<BlockControls>
						<ToolbarGroup>
							<ToolbarButton
								icon="admin-comments"
								isActive={wp.data.select('mdstore').getIsActive()}
								label={__('Comment')}
								onClick={onToggleNonTextBlock}
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

addFilter(
	'blocks.registerBlockType',
	'mdComment/gallery-extension',
	(settings, name) => {

		//User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6

		if (!(allowedBlocks.widget).includes(settings.name)) {
			const attributes = {
				...settings.attributes,
				datatext: {
					type: 'string',
				},
				suggestion_id: {    // For block level suggestion functionality @author / Mayank Jain - @since 3.4 
					type: 'string',
				},
			};
			return { ...settings, attributes };
		} else {
			const attributes = {
				...settings.attributes,
				datatext: {
					type: 'string',
				},
			};
			return { ...settings, attributes };
		}
	}
);

/**
 * Adds the datatext attribute to blocks during save, if it exists.
 * 
 * @param {Object} extraProps - The existing block save props.
 * @param {Object} blockType - The block type definition. 
 * @param {Object} attributes - The block attributes.
 * 
 * @returns {Object} The updated extraProps object with datatext added.
 */
addFilter('blocks.getSaveContent.extraProps', 'mdComment/saveDatatext', function (extraProps, blockType, attributes) {
	if ((allowedBlocks.text).includes(blockType.name)) {
		return extraProps;
	} else {
		if ('undefined' !== attributes.datatext || null !== attributes.datatext) {
			Object.assign(extraProps, {
				datatext: attributes.datatext,
			});
			return extraProps;
		}
	}
});

export default compose()(nonTextBlock);
