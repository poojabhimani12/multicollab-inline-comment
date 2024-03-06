const { Fragment } = wp.element; // eslint-disable-line
const { MediaUpload, MediaUploadCheck } = wp.blockEditor;// eslint-disable-line
const { Button, ResponsiveWrapper } = wp.components;// eslint-disable-line
import React from 'react';
import PropTypes from 'prop-types';
import renderHTML from 'react-render-html';
import ContentEditable from 'react-contenteditable';
import allowedBlocks from './allowedBlocks';
import icons from './icons';
const { __ } = wp.i18n;  // eslint-disable-line
const $ = jQuery; // eslint-disable-line
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export default class Comment extends React.Component {

    constructor(props) {

        super(props);
        this.contentEditable = React.createRef();
        this.edit = this.edit.bind(this);
        this.save = this.save.bind(this);
        this.remove = this.remove.bind(this);
        this.resolve = this.resolve.bind(this);
        this.copy = this.copy.bind(this);
        this.cancelEdit = this.cancelEdit.bind(this);
        this.state = { editing: false, showEditedDraft: false, contentHtml: '<br/>', editedTime: '', copySuccess: '' };
        this.val = props.value;

    }

    /**
     * React lifecycle method called after a component update.
     * Can compare prevProps/prevState with current props/state
     * and perform actions based on changes (e.g. data fetching).
     */
    componentDidUpdate() {

        if ($('mdspan[data-rich-text-format-boundary="true"]').length !== 0) {
            const editedCommentID = this.props.timestamp;
            const commenttedText = $('#' + editedCommentID + ' textarea').val();
            $('#' + editedCommentID + ' textarea').focus().val('').val(commenttedText);
        }
    }

    /**
     * Allows the user to edit the comment.
     * Binds edit event handler to enable editing UI.
     */
    edit() {
        this.setState({ editing: true });

        // Handling edited value.
        var editedValue = this.state.showEditedDraft ? this.props.editedDraft : this.props.children;

        editedValue = removeLinkFromEditableText(editedValue);
        this.state.contentHtml = editedValue;

        this.state.attachmentText = this.props.attachmentText;
        if ('' !== this.state.attachmentText) {
            this.setState({ mediaId: '', mediaName: '', mediaUrl: '' });
        }
    }

    /**
     * Saves the edited comment. 
     * Calls the saveComment prop method to persist changes.
     *
     * @param {object} event - The DOM event
     */
    save(event) {
        var elID = event.currentTarget.parentElement.parentElement.parentElement.parentElement.parentElement.id;
        let attachmentText;
        if ($(event.currentTarget).hasClass('btn-disabled')) {
            return false;
        }
        if ($(`#${elID} .js-cf-edit-comment`).text().trim().length !== 0) {
            var newText = this.state.contentHtml;
            if ('' === newText) {
                var noticeMsg =  __('Please add some comment. ', 'content-collaboration-inline-commenting');
                document.getElementById("cf-board__notice").innerHTML = noticeMsg;
                document.getElementById("cf-board__notice").setAttribute('style','display:block');
                setTimeout(function(){
                    document.getElementById("cf-board__notice").setAttribute('style','display:none');
                    document.getElementById("cf-board__notice").innerHTML = "";
                }, 3000);
                return false;
            }
            if (true === this.state.editing) {
                let editedTime = editedTimezone ? editedTimezone.editedTime : '';
                let editedTimeStamp = getTimestampWithTimezone();

                // code added by meet - removed state condition by pooja for edit attachment
                attachmentText = (('' !== this.state.attachmentText || 'undefined' !== this.state.attachmentText) || null === $('#cf_thumb_file').html()) ? this.state.attachmentText : $('#cf_thumb_file').html();
                this.state.editedTime = editedTime;
                this.state.editedTimestamp = editedTimeStamp;
                if ('' === this.state.attachmentText || undefined === this.state.attachmentText) {
                    attachmentText = $('#cf_thumb_file').html();
                }

                if ('' !== this.props.assignedText && undefined !== this.props.assignedText && null !== this.props.assignedText) {
                    $('#' + this.props.timestamp).find('.commentInnerContainer').children('.commentText').find('.readmoreTxt').after('<span class="assigned-meta-text">' + this.props.assignedText + '</span>');
                }
            }

            // Adding anchor tag around the linkable text.
            // For bug fixing of semicolon there is a little chnage in regex  
            newText = filterTextBeforeSave(newText);

            this.props.updateCommentFromBoard(newText, this.props.index, this.props.timestamp, this.props.dateTime, elID, this.state.editedTime, this.state.editedTimestamp, this.props.assignedText, attachmentText);

            this.setState({ editing: false });
        } else {
            var noticeMsg =  __('Please add some comment. ', 'content-collaboration-inline-commenting');
            document.getElementById("cf-board__notice").innerHTML = noticeMsg;
            document.getElementById("cf-board__notice").setAttribute('style','display:block');
            setTimeout(function(){
                document.getElementById("cf-board__notice").setAttribute('style','display:none');
                document.getElementById("cf-board__notice").innerHTML = "";
            }, 3000);

        }
    }

    /**
     * Removes a comment from the board when the delete icon is clicked. 
     * 
     * @param {Object} event - The delete click event object.
     * @param {string} index - The index of the comment to remove.
     * @param {string} timestamp - The timestamp of the comment to remove.  
     * @param {string} elID - The id of the element containing the comment.
    */
    remove(event) {
        const elID = $(event.currentTarget).closest('.cls-board-outer');
        this.props.removeCommentFromBoard(this.props.index, this.props.timestamp, elID[0].id);
        jQuery(".comment-delete-overlay").removeClass("show");
    }

    /**
     * Copies the URL for the comment thread to the clipboard.
     * 
     * @param {Object} event - The click event object.
     * Gets the closest element with class .cls-board-outer and extracts the id.
     * Sets the id as elIDRemove to use in the URL.
     * Constructs the URL using window.location.href and the elIDRemove id.
     * Clears any existing text from .copytext element.
     * Sets the .copytext text to the constructed URL.
     * Creates a hidden input, sets its value to the URL and selects it.
     * Executes the browser's copy command to copy the URL to the clipboard.
     * Sets the copySuccess state to show a message that the link was copied.
     * Starts an interval to reset the state after a delay.
    */
    copy(event) {
        var elID = $(event.currentTarget).closest('.cls-board-outer');
        elID = elID[0].id;
        const elIDRemove = elID;
        var current_url = window.location.href + '&current_url=' + elIDRemove;

        $('.copytext').text('');
        $('#' + elIDRemove).find('.copytext').text(current_url);
        //hack for safari = add style='position: absolute; top: -8888px; left: -8888px'
        var $temp = $("<input style='position: absolute; top: -8888px; left: -8888px'>");
        var $url = current_url;
        $("body").append($temp);
        $temp.val($url).select();
        document.execCommand("copy");
        event.target.focus();
        $temp.remove();
        this.setState({ copySuccess: __('Link Copied!', 'content-collaboration-inline-commenting') });
        clearInterval(this.resetState());

        // Create an auxiliary hidden input
        var aux = document.createElement("input");
        // Get the text from the element passed into the input
        //aux.setAttribute("value", document.getElementById('text_element').innerHTML);
        aux.select();
    }
    /**
     * Resets the copySuccess state after a delay.
     * This clears the copy success message after 3 seconds.
    */
    resetState() {
        setTimeout(() => this.setState({ copySuccess: '' }), 3000);
    }

    /**
     * Resolves a comment thread.
     * 
     * @param {Object} event - The event object. 
     * 
     * Gets the closest element with class .cls-board-outer and extracts the id.
     * Sets the id as elIDRemove to use later.
     * 
     * Gets the current post ID.
     * 
     * Sends an AJAX request to the server to resolve the thread.
     * 
     * After a timeout to prevent Git issue 470, removes the thread element.
     * 
     * Updates the comment count.
     * 
     * Gets all block elements with the thread ID in data-text.
     * Dispatches actions to remove the thread ID from their data.
     * 
     * Otherwise, removes the thread ID tag and element.
     * 
     * Dispatches actions to close the active thread and trigger layout update.
    */
    resolve(event) {
        var elID = $(event.currentTarget).closest('.cls-board-outer');
        elID = elID[0].id;
        const elIDRemove = elID;

        const CurrentPostID = wp.data.select('core/editor').getCurrentPostId(); // eslint-disable-line
        elID = '_' + elID;

        var data = {
            'action': 'cf_resolve_thread',
            'currentPostID': CurrentPostID,
            'metaId': elID
        };
        $.post(ajaxurl, data, function () { // eslint-disable-line

            // Add setTimeout to solve git issue: 470
            setTimeout(() => {
                $('#' + elIDRemove).remove();
            }, 1000);

            //Remove Visible
            $('#history-toggle').attr('data-count', $('.cls-board-outer').length);

            const dataBlocks = $('[datatext="' + elIDRemove + '"]').map(function () { // if datatext has more than one element resolved #518 @author - Mayank / since 3.5
                return $(this).attr('data-block');
            }).get();


            // Reset Comments Float.
            $('#cf-span__comments .cls-board-outer').removeClass('focus');
            $('#cf-span__comments .cls-board-outer').removeAttr('style');
            //Remove Non Text block class and remove attribute

            $('[datatext="' + elIDRemove + '"].cf-icon-wholeblock__comment').removeClass('cf-icon-wholeblock__comment'); // Remove comment icon #518 @author - Mayank / since 3.6
            $('[datatext="' + elIDRemove + '"]').removeClass('commentIcon ');
            $('[datatext="' + elIDRemove + '"]').removeClass('cf-onwhole-block__comment');
            let blockType = $('[datatext="' + elIDRemove + '"]').attr('data-type');
            let blockId = $('[datatext="' + elIDRemove + '"]').attr('data-block');
            //User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6

            //change code to support whole block comment/@author:Pooja/since 3.4
            if (undefined !== blockType && dataBlocks) {
                dataBlocks.forEach(function (clientId) {
                    wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, { datatext: '' });
                });
            }
            else {
                // Remove Tag.
                jQuery('[datatext=' + elIDRemove + ']').each(function () {
                    removeTag(elIDRemove); // eslint-disable-line
                    $('#' + elIDRemove).remove();// eslint-disable-line
                });
            }

            wp.data.dispatch('mdstore').setIsActive(false);
            jQuery.event.trigger({ type: "editorLayoutUpdate" });
        });


    }
    /**
     * Cancels editing the attachment text and resets it to the 
     * original props value. Also sets the editing state to false.
     */
    cancelEdit() {
        this.state.attachmentText = this.props.attachmentText;
        this.setState({ editing: false })
    }
    
    /**
     * Deletes the attachment for the comment by removing it from state 
     * and calling the removeAttachmentFromBoard reducer.
     * 
     * @param {Object} event - The delete attachment click event
     */
    deleteAttachment(event) {
        const elID = $(event.currentTarget).closest('.cls-board-outer');
        this.setState({ attachmentText: '', mediaId: '', mediaName: '', mediaUrl: '' })
        this.props.removeAttachmentFromBoard(this.props.index, this.props.timestamp, elID[0].id, this.props.attachmentText);
    }

    /**
     * Renders the comment in normal mode by returning the comment text.
     */
    renderNormalMode() {
        // Display the textarea for new comments.
        $('.cls-board-outer.focus .shareCommentContainer').show();

        const { index } = this.props;
        const commentStatus = this.props.status ? this.props.status : 'publish';
        const attachment = this.props.attachmentText;

        // convert time to timeAgo format

        let dateTime = timeAgo(this.props.timestamp);

        // code added by meet
        //let convertedDate = this.props.dateTime;
        let convertedDate = convertedDatetime(this.props.timestamp);

        var owner = '';
        try {
            owner = wp.data.select("core").getCurrentUser().id; // eslint-disable-line
        } catch (e) {
            owner = localStorage.getItem("userID");
        }

        let str = this.state.showEditedDraft ? this.props.editedDraft : this.props.children;
        let readmoreStr = '';
        const maxLength = 300;
        if (maxLength < str.replace(/<\/?[^>]+(>|$)/g, "").length) {
            readmoreStr = str;
            str = str.substring(0, maxLength) + '...';
        }
        // Removing contenteditable attr from the link.
        str = str.replace(/contenteditable=\"false\"/ig, 'data-edit="false"'); // eslint-disable-line

        // Limiting User Role Character.
        var userRolePartial = this.props.userRole;
        if (8 < userRolePartial.length) {
            userRolePartial = userRolePartial.slice(0, 8) + '...';
        }

        let displayValue = 'block';

        if (this.props.index > getCommentsLimit()) {
            displayValue = 'none';
        }
        if('' === attachment){
            this.state.attachmentText = '';
        }
        let userCapability = wp.data.select('mdstore').getUserCapability(); // Getting user's Capability value from mdstore @author - Mayank / since 3.6
        return (
            <div className={"commentContainer"} style={{ display: displayValue }} id={this.props.timestamp}>
                <div className="commentInnerContainer">
                    <div className="comment-header">
                        <div className="comment-details">
                            {"1" === this.props.showAvatars &&
                                <div className="avatar">
                                    <img src={this.props.profileURL} alt="avatar" />
                                </div>
                            }
                            <div className="commenter-name-time">
                                <div className="commenter-name">
                                {this.props.userName.charAt(0).toUpperCase() +
                                this.props.userName.slice(1)}
                                    <span className="tooltip">{this.props.userRole}</span>
                                </div>

                                <div className="comment-time"><span className="comment-time-wrapper">{dateTime} <span className="tooltip">{convertedDate} </span></span>
                                </div>
                            </div>
                            { 'viewer' !== userCapability?.capability &&
                                <div className="comment-actions">
                                            <React.Fragment>
                                                {index === 0 && "guest" !== currentUserData.role &&
                                                    <div className="comment-resolve">
                                                        <input id={"resolve_cb_" + this.props.timestamp + '_' + index} type="checkbox" className="resolve-cb" value="1" />
                                                        <label htmlFor={"resolve_cb_" + this.props.timestamp + '_' + index}>{__('Resolved', 'content-collaboration-inline-commenting')}</label>
                                                        <span className="tooltip">{__('Mark as Resolved', 'content-collaboration-inline-commenting')}</span>
                                                    </div>
                                                }
                                            </React.Fragment>
                                        
                                    
                                    {index === 0 &&
                                        (

                                            <React.Fragment>
                                                {'' !== this.state.copySuccess &&
                                                    <p className="comment-copied-tooltip">{this.state.copySuccess}</p>
                                                }
                                                <div className="buttons-wrapper">

                                                    <span className="tooltip">{__('More Options...', 'content-collaboration-inline-commenting')}</span>
                                                    <div className="more-option-btn"></div>
                                                    <div className="comment-more-option">
                                                        <ul className="comment-more-option-list">
                                                            <li onClick={this.copy.bind(this)}>
                                                                <i className="dashicons dashicons-share" title={__('Copy Link', 'content-collaboration-inline-commenting')}></i><span className="more-option-meta">{__('Share', 'content-collaboration-inline-commenting')}</span>
                                                            </li>
                                                            {this.props.userID === owner &&
                                                                <React.Fragment>
                      
                                                                  
                                                                       

                                                                            <li onClick={this.edit} className="js-edit-comment">
                                                                                <i className="dashicons dashicons-edit" title="Edit"></i><span className="more-option-meta">{__('Edit', 'content-collaboration-inline-commenting')}</span>
                                                                            </li>
                                                                            <li className="js-resolve-comment">
                                                                                <i className="dashicons dashicons-trash" title="Resolve"></i><span className="more-option-meta">{__('Delete', 'content-collaboration-inline-commenting')}</span>
                                                                            </li>

                                                                       
                                                                    

                                                                </React.Fragment>

                                                            }
                                                        </ul></div></div>
                                            </React.Fragment>

                                        )
                                    }
                                    {this.props.userID === owner && index > 0 &&
                                                                
                                                <React.Fragment>
                                                    <div className="buttons-wrapper">
                                                        <span className="tooltip">{__('More Options...', 'content-collaboration-inline-commenting')}</span>
                                                        <div className="more-option-btn"></div>
                                                        <div className="comment-more-option">
                                                            <ul className="comment-more-option-list">

                                                                <li onClick={this.edit}>
                                                                    <i className="dashicons dashicons-edit js-edit-comment" title="Edit"></i><span className="more-option-meta">{__('Edit', 'content-collaboration-inline-commenting')}</span>
                                                                </li>
                                                                <li className="js-trash-comment">
                                                                    <i className="dashicons dashicons-trash" title="Delete"></i><span className="more-option-meta">{__('Delete', 'content-collaboration-inline-commenting')}</span>
                                                                </li>
                                                            </ul></div></div>
                                                </React.Fragment>
                                    }

                                </div>
                            }
                        </div>
                    </div>
                    <div className="commentText">
                        <span className='readlessTxt readMoreSpan active' >{renderHTML(str)} {'' !== readmoreStr && <span className='readmoreComment'>{__('show more', 'content-collaboration-inline-commenting')}</span>}</span>
                        <span className='readmoreTxt readMoreSpan'>{renderHTML(readmoreStr)} {'' !== readmoreStr && <span className='readlessComment'>{__('show less', 'content-collaboration-inline-commenting')}</span>}</span>
                        {'' !== this.props.assignedText && undefined !== this.props.assignedText &&
                            <span className="assigned-meta-text">{this.props.assignedText}</span>
                        }
                        
                    </div>
                    <div className="comment-delete-overlay">
                        <span className="comment-overlay-text">{index === 0 ? __('Delete this comment thread?', 'content-collaboration-inline-commenting') : __('Delete this comment?', 'content-collaboration-inline-commenting')}</span>
                        <div className="comment-delete-overlay-inner">
                            <button onClick={index === 0 ? this.resolve.bind(this) : this.remove.bind(this)} className="btn btn-delete"> {__('Delete', 'content-collaboration-inline-commenting')}</button>
                            <button onClick={this.cancelEdit.bind(this)} className="btn btn-cancel">{__('Cancel', 'content-collaboration-inline-commenting')}</button>
                        </div>
                    </div>
                    {'' !== this.props.editedTimestamp && undefined !== this.props.editedTimestamp &&
                        <time className="updated-time">{sprintf(__('edited at %s', 'content-collaboration-inline-commenting'), timeAgo(this.props.editedTimestamp))}<span className="tooltip">{convertedDatetime(this.props.editedTimestamp.toString())}</span></time>
                    }
                    {'' === this.props.editedTimestamp && '' !== this.props.editedTime && undefined !== this.props.editedTime &&
                        <time className="updated-time">{sprintf(__('edited at %s', 'content-collaboration-inline-commenting'), this.props.editedTime)}<span className="tooltip">{this.props.editedTime}</span></time>
                    }
                </div>
            </div>
        );
    }

    /**
     * Renders the editing mode UI for the comment
     */
    renderEditingMode() {
        var previousValue = this.props.children;

        var previousAttachment = this.props.attachmentText;
        // Hide the textarea for new comments.
        $('.cls-board-outer.focus .shareCommentContainer').hide();

        // Limiting User Role Character.
        var userRolePartial = this.props.userRole;
        if (8 < userRolePartial.length) {
            userRolePartial = userRolePartial.slice(0, 8) + '...';
        }
        // convert time to timeAgo format 
        let dateTime = timeAgo(this.props.timestamp);
        let convertedDate = this.props.dateTime;

        previousValue = removeLinkFromEditableText(previousValue);
        previousValue = filterTextForEdit(previousValue);
        var newText = this.state.contentHtml;
        newText = filterTextForEdit(newText);
        
        var newAttchment = this.state.attachmentText;
        let buttonClass = '';
        if (newText === '' || (newText === previousValue && newAttchment === previousAttachment)) {
            buttonClass = 'btn-disabled';
        }
        return (
            <div className="commentContainer" id={this.props.timestamp}>
                <div className="commentInnerContainer">
                    <div className="comment-header">
                        <div className="comment-details">
                            <div className="avatar"><img src={this.props.profileURL} alt="avatar" /></div>
                            <div className="commenter-name-time">
                                <div className="commenter-name">
                                {this.props.userName.charAt(0).toUpperCase() +
                                this.props.userName.slice(1)}
                                    <span className="tooltip">{this.props.userRole}</span>
                                </div>
                                <div className="comment-time">{dateTime} <span className="tooltip">{convertedDate} </span> </div>
                            </div>
                        </div>
                    </div>
                    <div className="commentText">
                        <div className="cf-share-comment-wrapper js-cf-share-comment-wrapper">
                            <ContentEditable
                                innerRef={this.contentEditable}
                                html={this.state.contentHtml}
                                disabled={false}
                                onChange={(e) => this.setState({ contentHtml: e.target.value })}
                                id={`edit-${this.props.timestamp}`}
                                className="cf-share-comment js-cf-edit-comment"
                                placeholder={__('Edit your comments...', 'content-collaboration-inline-commenting')}

                            />
                        </div>

                        {'' !== this.props.assignedText && undefined !== this.props.assignedText &&
                            <span className="assigned-meta-text">{this.props.assignedText}</span>
                        }
                    </div>
                    <button onClick={this.save.bind(this)} className={`btn-comment save-btn ${buttonClass}`}>
                        {__('Save', 'content-collaboration-inline-commenting')}
                        <span className="tooltip">{__('Save Changes', 'content-collaboration-inline-commenting')}</span>
                    </button>
                    <button onClick={this.cancelEdit.bind(this)} className="btn-comment js-cancel-comment">
                        {__('Cancel', 'content-collaboration-inline-commenting')}
                        <span className="tooltip">{__('Discard Changes', 'content-collaboration-inline-commenting')}</span>
                    </button>
                </div>
            </div>
        );
    }

    /**
     * Renders the comment component in either normal or editing mode 
     * depending on the value of this.state.editing.
     * 
     * Normal mode renders the comment for display.
     * Editing mode renders the comment in an editable state.
     */
    render() {
        if (this.state.editing) {
            return this.renderEditingMode();
        } else {
            return this.renderNormalMode();
        }
    }
}


/**
 * PropTypes for the Comment component.
 * 
 * Defines the expected props and their types.
 * Used for runtime type checking.
 */
Comment.propTypes = {
    index: PropTypes.number,
    removeCommentFromBoard: PropTypes.func,
    updateCommentFromBoard: PropTypes.func,
    removeAttachmentFromBoard: PropTypes.func,
    userName: PropTypes.string,
    userRole: PropTypes.string,
    dateTime: PropTypes.string,
    profileURL: PropTypes.string,
    showAvatars: PropTypes.string,
    userID: PropTypes.number,
    status: PropTypes.string,
    lastVal: PropTypes.object,
    onChanged: PropTypes.func,
    selectedText: PropTypes.string,
    timestamp: PropTypes.number,
    editedDraft: PropTypes.string,
    children: PropTypes.string,
    editedTime: PropTypes.string,
    editedTimestamp: PropTypes.string,
    blockType: PropTypes.string,
    assignedText: PropTypes.string,
    attachmentText: PropTypes.string,
};
