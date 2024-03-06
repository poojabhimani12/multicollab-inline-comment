import Board from './component/board';
import React from 'react'
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import allowedBlocks from './component/allowedBlocks';
import Mdstore from './mdStore';
import classnames from 'classnames';

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
let isRichClassExist = document.activeElement.classList.contains('rich-text');     // eslint-disable-line                                              

const addNewAttribute = createHigherOrderComponent((BlockListBlock) => {
	return  (props) => {

		
		const { attributes, className } = props;
		let wrapperAttributes = {};
		let newDatatext = (attributes.datatext != undefined || attributes.datatext != '') ? attributes.datatext : '';
		let suggestion_id = (attributes.suggestion_id != undefined || attributes.suggestion_id != '') ? attributes.suggestion_id : '';
		let align_sg_id = (attributes.align_sg_id != undefined || attributes.align_sg_id != '') ? attributes.align_sg_id : '';
		let textAlign_sg_id = (attributes.textAlign_sg_id != undefined || attributes.textAlign_sg_id != '') ? attributes.textAlign_sg_id : '';
		let lock_sg_id = (attributes.lock_sg_id != undefined || attributes.lock_sg_id != '') ? attributes.lock_sg_id : '';
		let block_align = (attributes.align != undefined || attributes.align != '') ? attributes.align : '';
		if (align_sg_id) {
			wrapperAttributes.align_sg_id = align_sg_id;
		}
		if (textAlign_sg_id) {
			wrapperAttributes.textAlign_sg_id = textAlign_sg_id;
		}
		if (lock_sg_id) {
			wrapperAttributes.lock_sg_id = lock_sg_id;
		}
		if (block_align) {
			wrapperAttributes.block_align = "align"+block_align;
		}
		
		//User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
		if ((allowedBlocks.text).includes(props.name) ) {
			if(attributes.datatext && attributes?.suggestion_id ){
				return (
					<BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id}} className={classnames(className, 'cf-onwhole-block__comment')}/>

				);
			} else if (attributes.datatext){
				return (
					<BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'datatext': newDatatext, 'data-rich-text-format-boundary': true}} className={classnames(className, 'cf-onwhole-block__comment')}/>

				);
			} else if(attributes.suggestion_id ){
			
				return (
					<BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'suggestion_id': suggestion_id }} />
				  
				);
		  	} else{
				return (<BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes}} />);
			}
			
		} else if(attributes.datatext && attributes?.suggestion_id){
			return (
				<BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id}} className={classnames(className, 'cf-onwhole-block__comment')}/>

			);
		}
		
		if(attributes.datatext && attributes?.suggestion_id ){ // For block level suggestion functionality @author / Mayank Jain - @since 3.4 
			return <BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'datatext': newDatatext, 'data-rich-text-format-boundary': true, 'suggestion_id': suggestion_id }} className={classnames(className, 'commentIcon')} />;
		
		} else if (attributes.datatext) {	
			return <BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'datatext': newDatatext, 'data-rich-text-format-boundary': true }} className={classnames(className, 'commentIcon')} />;
		
		} else if( attributes?.suggestion_id ) {  // For block level suggestion functionality @author / Mayank Jain - @since 3.4
			return <BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes, 'suggestion_id': suggestion_id }} />;
	    
		}
		else if( block_align && attributes?.name?.startsWith('acf/')) {  // For ACF Blocks Width functionality @author / Pitam Dey - @since 4.3
			return <BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes}} className={classnames(className, 'align'+block_align)} />;
	    
		} 
		else {
			return <BlockListBlock {...props} wrapperProps={{ ...wrapperAttributes}} />;
		}
	};
}, 'addNewAttribute');

wp.hooks.addFilter(
    'editor.BlockListBlock',
    'mdComment/add-new-attribute',
    addNewAttribute,
    9
);

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

addFilter(
	'blocks.registerBlockType',
	'mdComment/nontextBlock-extension',
	 (settings, name) => {
		var prefix = 'core/';
        if( (name).startsWith(prefix) && !(name).startsWith('core/button') ){
		   settings.apiVersion = 2;
		}
		if (!(allowedBlocks.widget).includes(settings.name)) {
			const attributes = {
				...settings.attributes,
				datatext: {
					type: 'string',
				},
				suggestion_id: {
					type: 'string',
				},
				align_sg_id: {
					type: 'string',
				},
				textAlign_sg_id: {
					type: 'string',
				},
				lock_sg_id: {
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
 * Checks if the block name is one that should allow className attributes. 
 * Currently allows className attributes for core/block, core/freeform, 
 * core/more, core/nextpage, core/html, and core/shortcode blocks.
 * 
 * @param {Object} settings Block settings object
 * @param {string} name Block name
*/
function enableClassNameAttribute(settings, name) {
	if (['core/block', 'core/freeform', 'core/more', 'core/nextpage', 'core/html', 'core/shortcode'].indexOf(name) !== -1) {
        settings.supports = {
            ...settings.supports,
            className: true,
        };
		settings.attributes = {
            ...settings.attributes,
            className: {
				type: 'string',
			},
        };
    }
    return settings;
}
wp.hooks.addFilter('blocks.registerBlockType', 'mdComment/enable-classname', enableClassNameAttribute);



addFilter('blocks.getSaveContent.extraProps', 'mdComment/saveDatatext', function (extraProps, blockType, attributes) {
	if(attributes && attributes.suggestion_id && wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )['_sb_is_suggestion_mode']){ // For block level suggestion functionality @author / Mayank Jain - @since 3.4 ========== 
		Object.assign(extraProps, {
			suggestion_id: '',
		});
	}
	if(attributes && attributes.align_sg_id && wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )['_sb_is_suggestion_mode']){ // For align feature suggestion @author - Mayank / since @3.6
		Object.assign(extraProps, {
			align_sg_id: '',
		});
	}
	if(attributes && attributes.textAlign_sg_id && wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )['_sb_is_suggestion_mode']){ // For text align feature suggestion @author - Mayank / since @3.6
		Object.assign(extraProps, {
			textAlign_sg_id: '',
		});
	}
	if(attributes && attributes.lock_sg_id && wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' )['_sb_is_suggestion_mode']){ // For lock feature suggestion @author - Mayank / since @3.6
		Object.assign(extraProps, {
			lock_sg_id: '',
		});
	}
	if ((allowedBlocks.text).includes(blockType.name)  || isRichClassExist) {
		// return extraProps;
	} else {
		if ('undefined' !== attributes.datatext || null !== attributes.datatext) {
			
			Object.assign(extraProps, {
				datatext: attributes.datatext,
			});
			
			// return extraProps;
		}
	}
	return extraProps;
});
const customAttributes = createHigherOrderComponent(BlockEdit => {
	return (props) => {
		<BlockEdit {...props} />
	}

},customAttributes);


export default compose()(customAttributes);
