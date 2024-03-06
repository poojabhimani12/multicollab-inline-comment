import Comment from "./comment";
import React from "react";
import PropTypes from "prop-types";
import allowedBlocks from "./allowedBlocks";
import ContentEditable from "react-contenteditable";
import icons from "./icons";
import { undoRedoFun } from '../undoRedo'

const { __ } = wp.i18n; // eslint-disable-line
const $ = jQuery; // eslint-disable-line
const { removeFormat } = wp.richText; // eslint-disable-line
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const { Button, ResponsiveWrapper } = wp.components;
const { useSelect, useDispatch } = wp.data;
const { MediaUpload } = wp.blockEditor;
export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.contentEditable = React.createRef();
    this.displayComments = this.displayComments.bind(this);
    this.updateComment = this.updateComment.bind(this);
    this.removeComment = this.removeComment.bind(this);
    this.addNewComment = this.addNewComment.bind(this);
    this.cancelComment = this.cancelComment.bind(this);

    const currentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line
    const postSelections = [];
    let selectedText;
    let txtselectedText;
    let metaselectedText;

    // `this` is the div
    selectedText = this.props.datatext;
    txtselectedText = "txt" + selectedText;
    metaselectedText = "_" + selectedText;
    setTimeout(function () {
      $("#" + selectedText + " textarea").attr("id", txtselectedText);
    }, 3000);

    this.commentedOnText = this.props.commentedOnText;
    if (1 !== this.props.freshBoard) {
      wp.apiFetch({
        path:
          "cf/cf-get-comments-api/?currentPostID=" +
          currentPostID +
          "&elID=" +
          metaselectedText,
      }).then((fps) => {
        // eslint-disable-line

        const { userDetails, resolved, commentedOnText, assignedTo } = fps;

        // Update the 'commented on text' if not having value.
        this.commentedOnText =
          undefined !== this.commentedOnText
            ? this.commentedOnText
            : commentedOnText;
        this.assignedTo = assignedTo;

        if ("true" === resolved || 0 === userDetails.length) {
          let elIDRemove = selectedText;
          //Remove Non Text block class and remove attribute
          $('[datatext="' + selectedText + '"]').removeClass("commentIcon ");
          let blockType = $('[datatext="' + selectedText + '"]').attr(
            "data-type"
          );
          let blockId = $('[datatext="' + selectedText + '"]').attr(
            "data-block"
          );
          //User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
          if (allowedBlocks.text.includes(blockType)) {
            removeTag(elIDRemove); // eslint-disable-line
            $("#" + elIDRemove).remove();
          } else {
            wp.data.dispatch("core/block-editor").updateBlock(blockId, {
              attributes: {
                datatext: "",
              },
            });
            $("#" + selectedText).remove();
          }

          return false;
        }
        $.each(userDetails, function (key, val) {
          postSelections.push(val);
        });

        // Add text that the comment is removed.
        if (0 !== postSelections.length) {
          this.hasComments = 1;
        } else {
          this.hasComments = 0;
        }

        this.state = { comments: [postSelections] };
        this.setState({ comments: postSelections });
      });
    } else {
      try {
        this.currentUserName = wp.data.select("core").getCurrentUser().name; // eslint-disable-line
        const currentUserProfile = wp.data
          .select("core")
          .getCurrentUser().avatar_urls; // eslint-disable-line
        this.currentUserProfile =
          currentUserProfile[Object.keys(currentUserProfile)[1]];
      } catch (e) {
        this.currentUserName = localStorage.getItem("userName");
        this.currentUserProfile = localStorage.getItem("userURL");
      }
    }

    this.state = { comments: [], newcommentText: "" };
  }

  /**
   * Removes an attachment from a comment 
   * 
   * @param {number} idx - The index of the comment 
   * @param {string} cTimestamp - The timestamp of the comment
   * @param {string} elID - The element ID to remove 
   * @param {string} attachmentText - The text for the attachment
  */
  removeAttachment(idx, cTimestamp, elID, attachmentText) {
    const CurrentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line
    elID = "_" + elID;
    // Activate 'Save Draft' or 'Publish' button

    // code added by meet
    $("#" + cTimestamp + " .attachment-text").html("");

    // for empty attach icon remove - code added by meet
    $("#" + cTimestamp + " #cf_thumb_file").html("");
    wp.data
      .dispatch("core/editor")
      .editPost({ meta: { reflect_comments_changes: 1 } }); // eslint-disable-line
  }

  /**
   * Removes a comment from the state and deletes it from the server.
   * 
   * @param {number} idx - Index of the comment to remove in the comments array
   * @param {string} cTimestamp - Timestamp of the comment to remove 
   * @param {string} elID - Element ID of the comment to remove
  */
  removeComment(idx, cTimestamp, elID) {
    var arr = this.state.comments;

    arr.splice(idx, 1);
    const CurrentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line
    elID = "_" + elID;
    var data = {
      action: "cf_delete_comment",
      currentPostID: CurrentPostID,
      timestamp: cTimestamp,
      metaId: elID,
    };
    // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
    $.post(ajaxurl, data, function () {
      // eslint-disable-line
      // Activate 'Save Draft' or 'Publish' button
      wp.data
        .dispatch("core/editor")
        .editPost({ meta: { reflect_comments_changes: 1 } }); // eslint-disable-line
    });
    this.setState({ comments: arr, newcommentText: "" });
  }

  /**
   * Updates a comment in the state and on the server.
   *
   * @param {string} newText - The updated comment text 
   * @param {number} idx - The index of the comment to update
   * @param {string} cTimestamp - The timestamp of the comment to update
   * @param {string} dateTime - The date/time of the comment 
   * @param {string} metaID - The meta ID of the comment to update
   * @param {string} editedTime - The edited time of the comment
   * @param {string} editedTimestamp - The edited timestamp of the comment
   * @param {string} assignedText - The assigned text of the comment
   * @param {string} attachmentText - The attachment text of the comment
  */
  updateComment(
    newText,
    idx,
    cTimestamp,
    dateTime,
    metaID,
    editedTime,
    editedTimestamp,
    assignedText,
    attachmentText
  ) {
    var arr = this.state.comments;
    var userID = "";
    var userName = "";
    var userRole = "";
    var userProfile = "";
    try {
      userID = wp.data.select("core").getCurrentUser().id; // eslint-disable-line
      userName = wp.data.select("core").getCurrentUser().name; // eslint-disable-line
      userRole = wp.data.select("core").getUser(userID).roles[0]; // eslint-disable-line
      userProfile = wp.data.select("core").getCurrentUser().avatar_urls; // eslint-disable-line
      userProfile = userProfile[Object.keys(userProfile)[1]];
    } catch (e) {
      userID = localStorage.getItem("userID");
      userName = localStorage.getItem("userName");
      userRole = localStorage.getItem("userRole");
      userProfile = localStorage.getItem("userURL");
    }

    var newArr = {};
    newArr["userName"] = userName;
    newArr["userRole"] = userRole;
    newArr["profileURL"] = userProfile;
    newArr["dtTime"] = dateTime;
    newArr["thread"] = newText;
    newArr["userData"] = userID;
    newArr["index"] = idx;
    newArr["status"] = "publish";
    newArr["timestamp"] = cTimestamp;
    newArr["editedTime"] = editedTime;
    newArr["editedTimestamp"] = editedTimestamp;
    newArr["assignedText"] = assignedText;
    newArr["attachmentText"] = attachmentText;
    arr[idx] = newArr;
    const CurrentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line
    metaID = "_" + metaID;
    var data = {
      action: "cf_update_comment",
      currentPostID: CurrentPostID,
      editedComment: JSON.stringify(newArr),
      metaId: metaID,
    };

    // since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
    var _this = this;
    $.post(ajaxurl, data, function (data) {
      // eslint-disable-line

      data = $.parseJSON(data);
      if (undefined !== data.error) {
        alert(data.error);
        return false;
      }

      $("#" + cTimestamp + " #cf_thumb_file").html("");
      // Activate 'Save Draft' or 'Publish' button
      wp.data
        .dispatch("core/editor")
        .editPost({ meta: { reflect_comments_changes: 1 } }); // eslint-disable-line

      //Replace content with filter HTML(without HTML tags) which we get from AJAX response. Github issue: #491. @author: Rishi Shah @since: 3.5
      if (data.arr.thread) {
        arr[idx].thread = data.arr.thread;
      }

      _this.setState({ comments: arr });
    });
  }

  /**
   * Adds a new comment to the comments state and saves it to the post meta.
   * 
   * Gets the current user details, text content, and metadata then constructs a new 
   * comment object. Posts the new comment to the server and updates the component state
   * with the response. Handles validation, notifications, and undo/redo.
   */
  addNewComment(event) {

    // Add currunt user details in _realtime_collaborators meta.
    // Added condition if currunt user is already exist in meta to reduce Ajax call on every suggestion create.
    let activeUsers = wp.data.select("core/editor").getEditedPostAttribute("meta")?._realtime_collaborators;
    var curruntUser = getCurrentUserId();

    var activeUsersObj = activeUsers ? JSON.parse(activeUsers) : '';
    var curruntUserExist = activeUsersObj ? curruntUser in activeUsersObj : false;
    if (false === curruntUserExist) {
      var curruntUser = getCurrentUserId();
      wp.apiRequest({
        path: `wp/v2/users/${curruntUser}`,
      }).then((user) => {

        var curruntUser = {};
        var curruntUserArray = [];
        curruntUser.userAvatar = user.avatar_urls['96'];
        curruntUser.role = user.userRole;
        curruntUser.userId = user.id;
        curruntUser.email = user.user_email;
        curruntUser.username = user.name;
        curruntUserArray.push(curruntUser);

        var data = {
          action: "realtime_collaborators_update_ajax",
          activeUsers: JSON.stringify(curruntUserArray),
          postID: wp.data.select("core/editor").getCurrentPostId()
        };
        $.post(ajaxurl, data, function (result) {
          // eslint-disable-line
          wp.data.dispatch("core/editor").editPost({ meta: { _realtime_collaborators: result } });
        });
      });

    }

    event.preventDefault();
    const { datatext, mediaId, mediaUrl } = this.props;
    var currentTextID = "txt" + datatext;
    var newText = $("#" + currentTextID).html();
    var attachmentText = $("#cf_thumb_file").html();

    newText = filterTextBeforeSave(newText);

    let newTextstring = validateCommentReplyText(newText);

    if ("" !== newText && "" !== newTextstring && /\S/g.test(newTextstring)) {
      var userID = "";
      var userName = "";
      var userRole = "";
      var userProfile = "";
      try {
        userID = wp.data.select("core").getCurrentUser().id; // eslint-disable-line
        userRole = wp.data.select("core").getUser(userID).roles[0]; // eslint-disable-line
        userName = wp.data.select("core").getCurrentUser().name; // eslint-disable-line
      } catch (e) {
        userID = localStorage.getItem("userID");
        userName = localStorage.getItem("userName");
        userRole = localStorage.getItem("userRole");
      }

      if ("1" === localStorage.getItem("showAvatars")) {
        userProfile = wp.data.select("core").getCurrentUser().avatar_urls; // eslint-disable-line
        userProfile = userProfile[Object.keys(userProfile)[1]];
      } else {
        userProfile = localStorage.getItem("userURL");
      }
      var arr = this.state.comments;
      let blockType = $('[datatext="' + this.props.datatext + '"]').attr(
        "data-type"
      );
      if (allowedBlocks.media.includes(blockType)) {
        blockType = blockType;
      } else {
        if (
          !allowedBlocks.text.includes(blockType) &&
          undefined !== blockType
        ) {
          blockType = "md-block";
        } else {
          blockType = "";
        }
      }
      var newArr = {};
      newArr["userData"] = userID;
      newArr["thread"] = newText;
      newArr["commentedOnText"] =
        undefined !== this.commentedOnText ? this.commentedOnText : "";
      newArr["userName"] = userName;
      newArr["userRole"] = userRole;
      newArr["profileURL"] = userProfile;
      newArr["status"] = "publish";
      newArr["blockType"] = blockType;
      newArr["attachmentText"] = attachmentText;

      const CurrentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line

      var el = currentTextID.substring(3);
      var metaId = "_" + el;
      var assignTo = "";
      if ($("#" + el + " .cf-assign-to-user").is(":checked")) {
        assignTo = $("#" + el + " .cf-assign-to-user").val();
      }
      newArr["assigned"] = assignTo;
      arr.push(newArr);
      var data = {
        action: "cf_add_comment",
        currentPostID: CurrentPostID,
        commentList: JSON.stringify(arr),
        metaId: metaId,
        assignTo: assignTo,
        blockType: blockType,
      };

      $("#" + el + " .shareCommentContainer").addClass("loading");
      let _this = this;
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
      $.post(ajaxurl, data, function (data) {
        // eslint-disable-line
        $("#" + el + " .shareCommentContainer").removeClass("loading");
        $(".fresh-board").removeClass("fresh-board");

        data = $.parseJSON(data);
        if (undefined !== data.error) {
          alert(data.error);
          return false;
        }
        arr[arr.length - 1]["dtTime"] = data.dtTime;
        arr[arr.length - 1]["timestamp"] = data.timestamp;
        arr[arr.length - 1]["assignedText"] = data.assignedText;

        // Updating the assigned user info.
        if (null !== data.assignedTo) {
          var displayName = data.assignedTo.display_name
            ? data.assignedTo.display_name
            : __("Unknown User", "content-collaboration-inline-commenting");

          var assignedUserDetails = `
                        <div class="cf-board-assigned-to" data-user-id="${data.assignedTo.ID
            }" data-user-email="${data.assignedTo.user_email}">
                            <div class="assigned-user-details">
                                <div class="user-avatar">
                                    <img src="${data.assignedTo.avatar}" alt="${data.assignedTo.display_name
            }" />
                                </div>
                                <div class="user-info">
                                    <span class="badge"> ${__(
              "Assigned to",
              "content-collaboration-inline-commenting"
            )}</span>
                                    <p class="display-name">${__(
              displayName,
              "content-collaboration-inline-commenting"
            )}</p>
                                </div>
                            </div>
                        </div>
                    `;
          if ($(`#${el} .cf-board-assigned-to`).length) {
            $(`#${el} .cf-board-assigned-to`).remove();
          }
          $(assignedUserDetails).insertBefore(
            DOMPurify.sanitize(`#${el} .boardTop`)
          ); // phpcs:ignore
        }

        // Update hasComment prop for dynamic button text.
        _this.hasComments = 1;

        //Update Freshboard value for dynamic button text

        // Activate 'Save Draft' or 'Publish' button
        wp.data
          .dispatch("core/editor")
          .editPost({ meta: { reflect_comments_changes: 1 } }); // eslint-disable-line

        // Replace content with filter HTML(without HTML tags) which we get from AJAX response. Github issue: #491. @author: Rishi Shah @since: 3.5
        if (data.arr.thread) {
          var lastLength = arr.length - 1;
          arr[lastLength].thread = data.arr.thread;
        }

        // Set the state.
        _this.setState({
          comments: arr,
          newcommentText: "",
          mediaId: "",
          mediaName: "",
          mediaUrl: "",
        });

        var getundoData = wp.data.select('mdstore').getundoData();
        var tempArray = [];
        var arrObj = Object.assign({}, arr[0]);
        let obj;

        if (null !== getundoData) {
          obj = { id: datatext, data: arrObj };
          getundoData.push(obj);
          tempArray = getundoData;
        } else {
          obj = { id: datatext, data: arrObj };
          tempArray.push(obj);
        }
        wp.data.dispatch('mdstore').setundoData(tempArray);

        undoRedoFun(_this); //phpcs:ignore

        // Flushing the text from the textarea
        $("#" + currentTextID)
          .html("")
          .focus();
        $("#cf_thumb_file").html("");
        // Remove assign checkbox
        $(".cf-assign-to").remove();
      });
    } else {
      if ($(event.currentTarget).hasClass("btn-disabled")) {
        return false;
      }
      var noticeMsg = __(
        "Please add some comment. ",
        "content-collaboration-inline-commenting"
      );
      document.getElementById("cf-board__notice").innerHTML = noticeMsg;
      document
        .getElementById("cf-board__notice")
        .setAttribute("style", "display:block");
      setTimeout(function () {
        document
          .getElementById("cf-board__notice")
          .setAttribute("style", "display:none");
        document.getElementById("cf-board__notice").innerHTML = "";
      }, 3000);
    }
  }

  /**
   * Displays a comment on the board.
   * 
   * @param {Object} text - The comment data object.
   * @param {number} i - The index of the comment.
   * @returns {JSX.Element} - The Comment component.
   */
  displayComments(text, i) {
    const { lastVal, onChanged, selectedText } = this.props;
    let username,
      userRole,
      postedTime,
      postedComment,
      profileURL,
      userID,
      status,
      cTimestamp,
      editedDraft,
      updatedTime,
      blockType,
      assignedText,
      editedTimestamp,
      attachmentText;
    Object.keys(text).map((i) => {
      if ("userName" === i) {
        username = text[i];
      } else if ("userRole" === i) {
        userRole = text[i];
      } else if ("dtTime" === i) {
        postedTime = text[i];
      } else if ("thread" === i) {
        postedComment = text[i];
      } else if ("profileURL" === i) {
        profileURL = text[i];
      } else if ("userData" === i) {
        userID = parseInt(text[i], 10);
      } else if ("status" === i) {
        status = text[i];
      } else if ("timestamp" === i) {
        cTimestamp = text[i];
      } else if ("editedDraft" === i) {
        editedDraft = text[i];
      } else if ("updatedTime" === i) {
        updatedTime = text[i].toString();
      } else if ("blockType" === i) {
        blockType = text[i];
      } else if ("assignedText" === i) {
        assignedText = text[i];
      } else if ("editedTimestamp" === i) {
        editedTimestamp = text[i];
      } else if ("attachmentText" === i) {
        attachmentText = text[i];
      }
    });

    // Translation Added for Board Assigned and Reassigned to Text - coded by meet
    let translatedAssignedText = assignedText;
    let splitedUsername;
    if (translatedAssignedText?.includes("Assigned to You")) {
      translatedAssignedText = wp.i18n.__(
        "Assigned to You",
        "content-collaboration-inline-commenting"
      );
    } else if (translatedAssignedText?.includes("Reassigned to You")) {
      translatedAssignedText = wp.i18n.__(
        "Reassigned to You",
        "content-collaboration-inline-commenting"
      );
    } else if (translatedAssignedText?.includes("Assigned to")) {
      splitedUsername = translatedAssignedText.split("Assigned to");
      translatedAssignedText = sprintf(
        __("Assigned to %s", "content-collaboration-inline-commenting"),
        splitedUsername[1]
      );
    } else if (translatedAssignedText?.includes("Reassigned to ")) {
      splitedUsername = translatedAssignedText.split("Reassigned to");
      translatedAssignedText = sprintf(
        __("Reassigned to %s", "content-collaboration-inline-commenting"),
        splitedUsername[1]
      );
    }
    assignedText = translatedAssignedText;

    //Multiedit change for matching roles to sidebar collaborator list
    const currentPost = wp.data.select("core/editor").getCurrentPost();
    const postAuthor = currentPost?.author;
    if (postAuthor === userID) {
      userRole = "Owner";
    }

    return (
      <Comment
        key={i}
        index={i}
        removeCommentFromBoard={this.removeComment}
        updateCommentFromBoard={this.updateComment}
        removeAttachmentFromBoard={this.removeAttachment}
        userName={username}
        userRole={userRole}
        dateTime={postedTime}
        profileURL={profileURL}
        userID={userID}
        status={status}
        lastVal={lastVal}
        onChanged={onChanged}
        selectedText={selectedText}
        timestamp={cTimestamp}
        editedDraft={editedDraft}
        editedTime={updatedTime}
        editedTimestamp={editedTimestamp && editedTimestamp.toString()}
        blockType={blockType}
        assignedText={assignedText}
        attachmentText={attachmentText}
        showAvatars={localStorage.getItem("showAvatars")}
      >
        {(postedComment = postedComment ? postedComment : text)}
      </Comment>
    );
  }

  /**
   * Cancels adding a comment. 
   * 
   * Removes any comment UI elements that were added.
   * Resets comment related state.
   * Triggers events to hide comments UI.
  */
  cancelComment() {
    let currentComment = wp.data.select("mdstore").getAllCommentCount();

    // Reset Comments Float.
    //$('#cf-span__comments .cls-board-outer').removeClass('focus');
    $(".cf-icon__addBlocks, .cf-icon__removeBlocks").removeClass("focus"); // Added to support whole comment block functionality @author - Mayank / since 3.6

    const { datatext, onChanged, lastVal } = this.props;
    let blockType = $('[datatext="' + this.props.datatext + '"]').attr(
      "data-type"
    );

    var blockTypes = jQuery('[datatext="' + this.props.datatext + '"]').parents('[data-block]').attr('data-type');
    const clientId = jQuery('[datatext="' + this.props.datatext + '"]').parents('[data-block]').attr('data-block');
    const blockAttributes = wp.data.select('core/block-editor').getBlockAttributes(clientId);
    var prefixAcf = 'acf/';

    let blockId = $('[datatext="' + this.props.datatext + '"]').attr(
      "data-block"
    );
    const name = "multidots/comment";
    if (0 === $("#" + datatext + " .boardTop .commentContainer").length) {
      //User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
      //change code to support whole block comment/@author:Pooja/since 3.4
      if (undefined !== blockType) {
        $('[datatext="' + this.props.datatext + '"]').removeClass(
          "commentIcon "
        );
        wp.data.dispatch("mdstore").setIsActive(false);
        wp.data.dispatch("core/block-editor").updateBlock(blockId, {
          attributes: {
            datatext: "",
          },
        });
      } else if (blockTypes?.startsWith(prefixAcf) && undefined !== blockTypes) { // Added blockType condition and else condition to resolve github issue: 1197
        removeAcfTag(blockAttributes, clientId, datatext);
        wp.data.dispatch('mdstore').setIsActive(false);
      } else {
        onChanged(removeFormat(lastVal, name));
      }

      $("#" + this.props.datatext).remove();

      jQuery.event.trigger({ type: "editorLayoutUpdate" });
    }

    // Reset Comments Float.
    $("#cf-span__comments .cls-board-outer").removeClass("focus");
    $(".cf-icon-wholeblock__comment").removeClass("focus");
    $(".cf-icon-wholeblock__comment").removeClass("is-selected");
    $("#cf-span__comments .cls-board-outer").removeAttr("style");
    $("[data-rich-text-format-boundary]").removeAttr(
      "data-rich-text-format-boundary"
    );
    $('.cf-assign-to').remove();
    $("#cf-span__comments .comment-delete-overlay").removeClass("show");
    $(".commentIcon").removeClass("is-selected");
    $("#cf-span__comments .cls-board-outer .buttons-wrapper").removeClass(
      "active"
    );

    jQuery("#txt" + datatext).html("");
    // fixed git hub issue #30
    $("#cf_thumb_file").html("");
    this.setState({
      newcommentText: "",
      mediaId: "",
      mediaName: "",
      mediaUrl: "",
    });

    jQuery.event.trigger({ type: "showHideComments" });

    // Removing the active class form activity center on cancel.
    $(".js-activity-centre .user-data-row").removeClass("active");
  }

  /**
   * Deletes the attachment by resetting state for the attachment fields.
   * Also clears the attachment preview.
   */
  deleteAttachment() {
    this.setState({
      attachmentText: "",
      mediaId: "",
      mediaName: "",
      mediaUrl: "",
    });
    $("#cf_thumb_file").html("");
  }

  /**
   * When the component mounts, if the freshBoard prop is true, 
   * set focus to the textarea with ID txt + the datatext prop
   * value after a small delay. This allows smooth focusing 
   * on component mount.
   */
  componentDidMount() {
    if (this.props.freshBoard) {
      const datatext = this.props.datatext;
      setTimeout(function () {
        $("#txt" + datatext).focus();
      }, 500);
    }
  }

  /**
   * Renders the Board component UI.
   * This is the main render method that displays the comment board UI.
   */
  render() {
    const { datatext, setAttributes, attributes } = this.props;
    const buttonText =
      1 === this.hasComments
        ? __("Reply", "content-collaboration-inline-commenting")
        : __("Comment", "content-collaboration-inline-commenting");
    const tooltipText =
      1 === this.hasComments
        ? __("Reply to this comment", "content-collaboration-inline-commenting")
        : __("Post Comment", "content-collaboration-inline-commenting");
    const assignedTo = this.assignedTo;
    var placeHolder =
      1 === this.hasComments || undefined === this.hasComments
        ? __(
            "Reply or add others with @",
            "content-collaboration-inline-commenting"
          )
        : __(
            "Comment or add others with @",
            "content-collaboration-inline-commenting"
          );
    if (this.props.freshBoard) {
      placeHolder = __(
        "Comment or add others with @",
        "content-collaboration-inline-commenting"
      );
    }
    let commentCount = this.state.comments.length;
    let displayValue = "none";
    if (commentCount > getCommentsLimit()) {
      displayValue = "block";
    }
    var newText = this.state.newcommentText;
    newText = validateCommentReplyText(newText);

    let buttonClass = "";
    if (newText === "") {
      buttonClass = "btn-disabled";
    }
    return (
      <div
        className={`board  ${
          undefined === this.hasComments &&
          this.currentUserProfile &&
          "fresh-board"
        }`}
      >
        {undefined !== assignedTo && null !== assignedTo && (
          <div
            className="cf-board-assigned-to"
            data-user-id={assignedTo.ID}
            data-user-email={assignedTo.user_email}
          >
            <div className="assigned-user-details">
              <div className="user-avatar">
                <img src={assignedTo.avatar} alt={assignedTo.display_name} />
              </div>
              <div className="user-info">
                <span className="badge">
                  {__("Assigned to", "content-collaboration-inline-commenting")}
                </span>
                <p className="display-name">
                  {assignedTo.display_name
                    ? __(

                      assignedTo.display_name.charAt(0).toUpperCase() +
                        assignedTo.display_name.slice(1) ,
                        "content-collaboration-inline-commenting"
                      )
                    : __(
                        "Unknown User",
                        "content-collaboration-inline-commenting"
                      )}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="boardTop">
          {this.state.comments &&
            this.state.comments.map((item, index) => {
              return this.displayComments(item, index);
            })}
          <div className="show-all-comments" style={{ display: displayValue }}>
            {sprintf(__("Show all %d replies"), commentCount - 1)}
          </div>
        </div>
        {undefined === this.hasComments && this.currentUserProfile && (
          <div className="commentContainer">
            <div className="commentInnerContainer">
              <div className="comment-header">
                <div className="comment-details">
                  <div className="avatar">
                    <img src={this.currentUserProfile} alt="avatar" />
                  </div>
                  <div className="commenter-name-time">
                    <div className="commenter-name">
                    {this.currentUserName.charAt(0).toUpperCase() + this.currentUserName.slice(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="shareCommentContainer">
          <div className="cf-share-comment-wrapper js-cf-share-comment-wrapper">
            <ContentEditable
              innerRef={this.contentEditable}
              html={this.state.newcommentText}
              disabled={false}
              onChange={(e) =>
                this.setState({ newcommentText: e.target.value })
              }
              id={"txt" + datatext}
              className="cf-share-comment js-cf-share-comment"
              placeholder={placeHolder}
            />
            <div className="cf-commentboard-attach-wrap">
              {this.state.mediaId != undefined && (
                <div id="cf_thumb_file">
                  <a href={this.state.mediaUrl} target="_blank">
                    {this.state.mediaName}
                  </a>
                </div>
              )}
              <div className="btn-wrapper">
                <button
                  onClick={this.addNewComment}
                  className={`btn btn-success ${buttonClass}`}
                >
                  {buttonText}
                  <span className="tooltip">{tooltipText}</span>
                </button>
                <button onClick={this.cancelComment} className="btn btn-cancel">
                  {__("Cancel", "content-collaboration-inline-commenting")}{" "}
                  <span className="tooltip">
                    {__(
                      "Discard Comment",
                      "content-collaboration-inline-commenting"
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * PropTypes for the Board component.
 * 
 * lastVal: The last value from the board state.
 * datatext: The data text prop. 
 * onChanged: Callback when the board changes.
 * selectedText: The currently selected text.
 * commentedOnText: The text that has been commented on.
 * freshBoard: Whether this is a fresh board render. 
 * onLoadFetch: Callback when the board loads/fetches data.
 */
Board.propTypes = {
  lastVal: PropTypes.object,
  datatext: PropTypes.string,
  onChanged: PropTypes.func,
  selectedText: PropTypes.string,
  commentedOnText: PropTypes.string,
  freshBoard: PropTypes.number,
  onLoadFetch: PropTypes.number,
};
