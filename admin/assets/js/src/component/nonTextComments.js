import Board from './board';
import React from 'react'
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import allowedBlocks from './allowedBlocks';
import Mdstore from '../mdStore';
import ACFBlocks from './acfBlocks';

import assign from "lodash.assign";
const { __ } = wp.i18n;                                                   // eslint-disable-line
const { getBlockType } = wp.data.select('core/blocks'); 			    // eslint-disable-line
const $ = jQuery;                                                       // eslint-disable-line
const ACFInstance = new ACFBlocks();
let isRichClassExist = document.activeElement.classList.contains('rich-text');     // eslint-disable-line   
export default class NonTextComments extends React.Component {
    constructor(props) {
        super(props);
        this.onToggleNonTextBlock = this.onToggleNonTextBlock.bind(this);

    }
    
    /**
     * Handles toggling the non-text block editor.
     * Binds the toggle event and handles opening/closing the editor.
     */
    onToggleNonTextBlock() {
        var currentTime = Date.now();
        currentTime = 'el' + currentTime;
        var block = wp.data.select('core/block-editor').getSelectedBlock();
        var notAllowedBlocksAcf = ['acf/acfb-posts', 'acf/acfb-business-hours', 'acf/acfb-socialsharing'];
        var prefixAcf = 'acf/';
        if (block.name.startsWith(prefixAcf)) {
            var selection = window.getSelection();
            var selectedText = selection.toString();
            var wholeBlockComment = false;

            if (selectedText) {
                var range = selection.getRangeAt(0);
                var startContainer = range.startContainer;
                var endContainer = range.endContainer;

                // Get the distinct parent elements for the start and end containers
                var startParent = getParentElement(startContainer);
                var endParent = getParentElement(endContainer);

                var acfRestrictClass = ['acfb_price_list_price', 'acfb_progress_percentage', 'acfb_counter_number', 'acfb_pricing_box_price'];
                if (startParent) {
                    for (var i = 0; i < acfRestrictClass.length; i++) {
                        if (startParent.classList.contains(acfRestrictClass[i])) {
                            nonTextNoticeMsg();
                            return;
                        }
                    }
                }

                // Check if there are different parent elements
                if (startParent !== endParent) {
                    wholeBlockComment = true;
                } else {
                    $(".toolbar-button-with-nontext").removeClass("is-pressed");
                }
            } else {
                wholeBlockComment = true;
            }

            // Function to find the nearest parent element of a node, excluding mdspan
            function getParentElement(node) {
                while (node && node.nodeType !== Node.ELEMENT_NODE) {
                    node = node.parentElement || node.parentNode;
                }
                while (node && (!node.classList || node.classList.length === 0)) {
                    node = node.parentElement || node.parentNode;
                }
                if (node && node.classList && node.classList.contains('mdspan-comment')) {
                    node = getParentElement(node.parentElement || node.parentNode);
                }
                return node;
            }

            if (wholeBlockComment) {
                var blockName = block.name;
                var blockType = getBlockType(blockName);
                var commentedOnText = this.getCommentedText(blockType.title, block);
                var blockIndex = block.clientId;
                var blockId = "block-" + blockIndex;
                var existingDatatext = wp.data.select('core/block-editor').getBlockAttributes(blockIndex).datatext;
                wp.data.dispatch('mdstore').setIsActive(true);

                //Restrict multiple comment on same block
                if (existingDatatext) {
                    showNoticeMsg();
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
                    referenceNode.removeChild(newNode);
                    var selectedBlock = __('Please select block/image to comment on.', 'content-collaboration-inline-commenting');
                    alert(selectedBlock);
                    return;
                }

                wp.data.dispatch('core/block-editor').updateBlock(blockIndex, {
                    attributes: {
                        datatext: currentTime,
                    }
                });

            } else if (!notAllowedBlocksAcf.includes(block.name)) {

                if (selectedText.trim() === '') {
                    nonTextNoticeMsg();
                    return;
                }

                if (selectedText.trim() !== '') {
                    var mdspanElement = selection.anchorNode.parentElement.closest('.mdspan-comment');
                    if (mdspanElement) {
                        var datatextValue = mdspanElement.getAttribute('datatext');
                    }
                }

                var activeDataText = datatextValue;
                if (activeDataText) {
                    wp.data.dispatch('mdstore').setIsActive(true);
                }
                var openBoardDataText = $(".is-open").attr("id");
                if (
                    $(".cls-board-outer").hasClass("is-open") &&
                    activeDataText === openBoardDataText &&
                    undefined !== openBoardDataText
                ) {
                    showNoticeMsg();
                    return;
                }

                var html = getSelectionHtml();
                var already_commented = jQuery(".cf-floating__button ul li:first-child").attr("already_commented");
                if (null !== html.match(/mdspan/g) || "true" === already_commented) {
                    showNoticeMsg();
                    return;
                }

                var commentedOnText = window.getSelection().toString();
                var selection = window.getSelection().getRangeAt(0);
                var selectedText = selection.extractContents();
                var span = document.createElement("mdspan");
                span.setAttribute('datatext', currentTime);
                span.setAttribute('class', 'mdspan-comment non-core-block');
                span.appendChild(selectedText);
                selection.insertNode(span);
                var newNode = document.createElement('div');
                newNode.setAttribute("id", currentTime);
                newNode.setAttribute("class", 'cls-board-outer draftComment cm-board');
                var referenceNode = document.getElementById('cf-span__comments');

                if (null === referenceNode) {
                    createCommentNode();
                    referenceNode = document.getElementById('cf-span__comments');
                }

                referenceNode.appendChild(newNode);

                ReactDOM.render(
                    <Board datatext={currentTime} freshBoard={1} commentedOnText={commentedOnText} />,
                    document.getElementById(currentTime)
                );

                // Open the edit-block sidebar
                wp.data.dispatch('core/edit-post').openGeneralSidebar('edit-post/block');

                setTimeout(function () {
                    ACFInstance.acfBlocks(currentTime, block);
                }, 500);
            }
        }
        else {
            var blockName = block.name;
            var blockType = getBlockType(blockName);
            var commentedOnText = this.getCommentedText(blockType.title, block);
            var blockIndex = block.clientId;
            var blockId = "block-" + blockIndex;
            var existingDatatext = wp.data.select('core/block-editor').getBlockAttributes(blockIndex).datatext;
            wp.data.dispatch('mdstore').setIsActive(true);

            //Restrict multiple comment on same block
            if (existingDatatext) {
                showNoticeMsg();
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
                referenceNode.removeChild(newNode);
                var selectedBlock = __('Please select block/image to comment on.', 'content-collaboration-inline-commenting');
                alert(selectedBlock);

                return;
            }
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
        setTimeout(function () { // Fixed issue #534 @author - Mayank / since 3.6
            $('#' + currentTime).offset({ top: $('[datatext="' + currentTime + '"]').offset().top });
        }, 500);
        const topOfText = $('[datatext="' + currentTime + '"]').offset().top || ''; // Fixed issue #534 @author - Mayank / since 3.6
        if (topOfText) {
            scrollBoardToPosition(topOfText);
        }

        $('#' + currentTime).addClass('has_text').show();
        $('#' + currentTime + '.cls-board-outer').addClass('is-open');
        $('#history-toggle').attr('data-count', $('.cls-board-outer').length);
        //Activate Show All comment button in setting panel
        $('.comment-toggle .components-form-toggle').removeClass('is-checked');
        //$('.comment-toggle .components-base-control__help').html('All comments will show on the content area.');
        if (!block.name.startsWith(prefixAcf)) {
            wp.data.dispatch('core/block-editor').updateBlock(blockIndex, {
                attributes: {
                    datatext: currentTime,
                }
            });

        }
        wp.data.dispatch('mdstore').setDataText(currentTime);

    };

    /**
     * Gets the text that was commented on for the given block.
     * 
     * For media blocks like image/video/audio/gallery, returns the file name.
     * For other blocks, returns the block name.
     * 
     * @param {string} blockType - The block type 
     * @param {Object} block - The block object
     * @returns {string} The commented on text
     */
    getCommentedText(blockType, block) {
        var commentedOnText, url;
        //User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
        if ((allowedBlocks.media).includes(block.name)) {

            if ('core/video' === block.name || 'core/audio' === block.name) {
                url = block.attributes.src;
            } else if ('core/media-text' == block.name) {
                url = block.attributes?.mediaUrl;
            } else if ('core/gallery' == block.name) {
                //url = block.attributes.images[0]?.url;
                // Add condition to resolve whole gallery block comment issue.
                if (block.attributes.images.length > 0) {
                    url = block.attributes.images[0]?.url;
                } else {
                    return commentedOnText = [blockType, ' Block '].join('');
                }
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
                commentedOnText = [blockType, ' Block '].join('');
                [blockType, ' Block '].join('');
            }
            else {
                // commentedOnText = blockType.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
                commentedOnText = [blockType, ' Block '].join('');

            }
            return commentedOnText;
        }

    }

}
