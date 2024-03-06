import React from "react";
import axios from "axios";
import renderHTML from "react-render-html";
import _merge from "lodash.merge";
import Board from "./component/board";
import ReactDOM from "react-dom";

const { __ } = wp.i18n;
const { Fragment } = wp.element;
const { registerPlugin } = wp.plugins;
const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
const { PanelBody, TabPanel, ToggleControl, Button, Panel, Icon, Tooltip } =
  wp.components;

import icons from "./component/icons";

const $ = jQuery; // eslint-disable-line
let isCommentor = false; // To check is user commentor
class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      threads: [],
      isLoading: true,
      showComments: wp.data.select("mdstore").getShowComments(),
      collapseLimit: 50,
      hasAccordian: false,
      hasAccordianComments: false,
      usersWithAccess: [],
    };

    // Get the Page ID.
    this.postID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line

    // Binding Methods.
    this.edit = this.edit.bind(this);
    this.reply = this.reply.bind(this);
    this.delete = this.delete.bind(this);
    this.toggleCollapseLink = this.toggleCollapseLink.bind(this);
    this.resolveThread = this.resolveThread.bind(this);
    this.handleShowComments = this.handleShowComments.bind(this);
    this.getComments = this.getComments.bind(this);

    // Grab the current user id.
    this.currentUserID = activityLocalizer.currentUserID;
    this.setUserFlag;
  }

  /**
   * Collapses the comment board on mobile screens.
   */
  collapseBoardOnMobile() {
    var checkWidth = window.innerWidth;
    if (768 >= checkWidth) {
      this.setState({
        showComments: wp.data.dispatch("mdstore").setShowComments(false),
      });
      $("body").addClass("hide-comments");
      //$('body').removeClass('commentOn');
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
    }
  }

  /**
   * Collapse Selected Text.
   */
  collapseText(str) {
    let text = str;
    if (
      null !== this.state.collapseLimit &&
      null !== text &&
      this.state.collapseLimit <= str.replace(/<\/?[^>]+(>|$)/g, "").length
    ) {
      text =
        str.slice(0, this.state.collapseLimit) +
        (str.length > this.state.collapseLimit ? "..." : "");
    }
    return __(text, "content-collaboration-inline-commenting");
  }

  /**
   * Changing collapse link text.
   */
  toggleCollapseLink(e) {
    var targetID = e.target.dataset.id;
    var _this = e.target;
    if (_this.innerHTML === "Show more") {
      _this.innerHTML = __(
        "Show less",
        "content-collaboration-inline-commenting"
      ); // phpcs:ignore
      $(`#show-all-${targetID}`).removeClass("js-hide");
      $(`#show-less-${targetID}`).addClass("js-hide");
    } else {
      _this.innerHTML = __(
        "Show more",
        "content-collaboration-inline-commenting"
      ); // phpcs:ignore
      $(`#show-all-${targetID}`).addClass("js-hide");
      $(`#show-less-${targetID}`).removeClass("js-hide");
    }
  }

  /**
   * Get All Comments Related to this Post.
   */
  getComments() {
    // Set Loaidng to true;
    this.setState({ isLoading: true });

    const url = `${activityLocalizer.apiUrl}/cf/v2/activities`;
    axios
      .get(url, {
        params: {
          postID: this.postID,
        },
        headers: {
          "X-WP-Nonce": activityLocalizer.nonce,
        },
      })
      .then((res) => {
        if (res.data.threads.length > 0) {
          this.setState({
            threads: res.data.threads,
            isLoading: false,
          });
        } else {
          this.setState({
            threads: null,
            isLoading: false,
          });
        }
      })

      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Get all comments boards related to this Post.
   * @author: Nirav Soni @since-4.0
   */
  getCommentsBoard(){

      var referenceNode = document.getElementById("cf-span__comments");

      var selectedTexts = [];

      // get editor datatext value
      const elementsByDatatext = document.querySelectorAll('[datatext]');
      const elementsByDatatextArr = Array.prototype.map.call(elementsByDatatext, el => el.getAttribute("datatext"));
      const uniqueDatatextArr = elementsByDatatextArr.filter((element, index) => {
        return elementsByDatatextArr.indexOf(element) === index;
      });

      const {
        threads
      } = this.state;

      if (threads !== null && threads !== undefined) {
        threads.map((th) => {
          if (th.resolved === "true") {
            var resolvedId = document.getElementById(th.elID);
            resolvedId?.remove();
            if( uniqueDatatextArr.includes(th.elID) ){
              let blockType = $('[datatext="' + th.elID + '"]').attr('data-type');
              const dataBlocks = $('[datatext="' + th.elID + '"]').map(function() { // if datatext has more than one element resolved #518 @author - Mayank / since 3.5
                  return $(this).attr('data-block');
              }).get();
              if ( undefined !== blockType && dataBlocks) {
                  dataBlocks.forEach(function(clientId) {
                      wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, { datatext: '' });
                  });
              }
              else{
                  // Remove Tag.
                  jQuery('[datatext=' + th.elID + ']').each(function () {
                      removeTag(th.elID); // eslint-disable-line
                      $('#' + th.elID).remove();// eslint-disable-line
                  });
              }
            }
          }
        });
      }

      var selectedNontextblock = fetchBoardsCommonCode();

      selectedTexts = selectedNontextblock;
      selectedTexts = selectedTexts.filter(function (e) {
        return e;
      });
      if(selectedTexts.length === 0){
        $('#cf-span__comments').empty()
      }
      selectedTexts.forEach((selectedText) => {
        if (
          "undefined" !== selectedText &&
          selectedText.match(/^el/m) !== null
        ) {
            var getSelectedText = document.getElementById(selectedText);

            if(getSelectedText){
              var hasClassList = getSelectedText.classList;
              if (
                hasClassList.contains('is-open') &&
                hasClassList.contains('focus')) {
                return;
              }
              getSelectedText?.remove();
            }
            var newNode = document.createElement("div");
            newNode.setAttribute("id", selectedText);
            newNode.setAttribute("class", "cls-board-outer cm-board");
            referenceNode.appendChild(newNode);

            ReactDOM.render(
                <Board datatext={selectedText} onLoadFetch={1} />,
                  document.getElementById(selectedText)
            );
        }
      });
  }
  /**
   * Setup active activity board.
   */
  setActiveBoard(elID) {
    var findMdSpan = ".mdspan-comment";

    $(findMdSpan).each(function () {
      var datatext = $(this).attr("datatext");
      if (elID === datatext) {
        $(".js-activity-centre .user-data-row").removeClass("active");
        $(`#cf-${elID}`).addClass("active");
        $('[datatext="' + elID + '"]').removeClass("is-selected");
      }
    });
    if ($('[datatext="' + elID + '"]').hasClass("commentIcon")) {
      $('[datatext="' + elID + '"]').addClass("is-selected");
    }
  }

  /**
   * Highlight Selected Text From Editor.
   */
  highlightSelectedText(elID) {
    var findMdSpan = ".mdspan-comment";
    $(findMdSpan).attr("data-rich-text-format-boundary", "false");
    $(findMdSpan).each(function () {
      var datatext = $(this).attr("datatext");
      if (elID === datatext) {
        $(this).attr("data-rich-text-format-boundary", "true");
      }
    });

    if ($(`#${elID}`).hasClass("sg-board")) {
      let sid = $(`#${elID}`).attr("data-sid");
      $(`#${sid}`).attr("data-rich-text-format-boundary", "true");
    }
  }

  /**
   * CLosing Sidebar On Mobile.
   */
  closingSidebarOnMobile() {
    var checkWidth = window.innerWidth;
    if (768 >= checkWidth) {
      wp.data.dispatch("core/edit-post").closeGeneralSidebar();
    }
  }

  /**
   * Add active class on activity center thread on post status change.
   */
  addActiveClassOnPostStatusChange() {
    const addActiveClass = setInterval(() => {
      var activeBoard = $(".cls-board-outer.focus").attr("id");
      if (undefined !== activeBoard) {
        if ($(`#cf-${activeBoard}`).hasClass("active")) {
          clearInterval(addActiveClass);
        }
        $(".cf-activity-centre .user-data-row ").removeClass("active");
        $(`#cf-${activeBoard}`).addClass("active");
      } else {
        clearInterval(addActiveClass);
      }
    }, 1000);
  }

  /**
   * Resolving Thread.
   */
  resolveThread(e) {
    // Open comment if not opened.
    if (false === wp.data.select("mdstore").getShowComments()) {
      this.handleShowComments();
    }
    var elID = e.target.dataset.elid;
    elID = elID.replace("cf-", "");
    $(`#${elID}`).trigger("click");
    $(`#${elID} .resolve-cb`).trigger("click");
    // Closing Sidebar On Mobile.
    this.closingSidebarOnMobile();
  }

  /**
   * Reply on a thread.
   */
  reply(e) {
    e.preventDefault();

    // Resetting all reply comment textarea.
    $(".js-cancel-comment").trigger("click");

    // Open comment if not opened.
    if (false === wp.data.select("mdstore").getShowComments()) {
      this.handleShowComments();
    }
    var elID = e.target.dataset.elid;
    elID = elID.replace("cf-", "");

    $(".cls-board-outer").removeClass("focus").css({ opacity: 0.4, top: 0 }); // Resetting before trigger.
    $(`#${elID}`).trigger("click");
    $(`mdspan[datatext=${elID}]`).trigger("click");

    // Highlight selected text from editor.
    this.highlightSelectedText(elID);

    // Setting active class on activity center.
    this.setActiveBoard(elID);

    // Closing Sidebar On Mobile.
    this.closingSidebarOnMobile();
  }

  /**
   * Edit a message.
   */
  edit(e) {
    e.preventDefault();
    // Open comment if not opened.
    if (false === wp.data.select("mdstore").getShowComments()) {
      this.handleShowComments();
    }

    var elID = e.target.dataset.elid;
    elID = elID.replace("cf-", "");

    var editID = e.target.dataset.editid;
    editID = editID.replace("cf-", "");

    $(".js-cancel-comment").trigger("click");
    $(".cls-board-outer").removeClass("focus").css({ opacity: 0.4, top: 0 }); // Resetting before trigger.
    $(`#${elID}`).trigger("click");
    $(`#${elID} #${editID} .js-edit-comment`).trigger("click");

    // Highlight selected text from editor.
    this.highlightSelectedText(elID);

    // Setting active class.
    this.setActiveBoard(elID);

    // Closing Sidebar On Mobile.
    this.closingSidebarOnMobile();
  }

  /**
   * Delete a message.
   */
  delete(e) {
    e.preventDefault();
    // Open comment if not opened.
    if (false === wp.data.select("mdstore").getShowComments()) {
      this.handleShowComments();
    }

    var elID = e.target.dataset.elid;
    elID = elID.replace("cf-", "");
    var deleteID = e.target.dataset.deleteid;
    deleteID = deleteID.replace("cf-", "");
    $(`#${elID}`).trigger("click");
    $(`#${elID} #${deleteID}`).find(".comment-delete-overlay").addClass("show");

    // Highlight selected text from editor.
    this.highlightSelectedText(elID);

    // Setting active class.
    this.setActiveBoard(elID);

    // Closing Sidebar On Mobile.
    this.closingSidebarOnMobile();
  }

  /**
   * Track if post updated or published.
   */
  isPostUpdated() {
    const _this = this;
    //set flag to restrict multiple call
    var checked = true;
    wp.data.subscribe(function () {
      let select = wp.data.select("core/editor");
      var isSavingPost = select.isSavingPost();
      var isAutosavingPost = select.isAutosavingPost();
      var didPostSaveRequestSucceed = select.didPostSaveRequestSucceed();
      var status = wp.data
        .select("core/editor")
        .getEditedPostAttribute("status");

      //dynamic layout width @author: Minal Diwan @since-3.3
      const $boardOuter = $("#cf-span__comments .cls-board-outer");
      setTimeout(function () {
        const $boardOuter = $("#cf-span__comments .cls-board-outer");
        const ediLayot = document.querySelector(".editor-styles-wrapper");
        const cmntLayout = document.querySelector(
          "#cf-comments-suggestions__parent"
        );
        const ediLayotWidth = ediLayot?.offsetWidth;
        const cmntLyotWidth = cmntLayout?.offsetWidth;
        const calcLyotWidth = ediLayotWidth - cmntLyotWidth;
        const checkVisualedit = wp.data
          .select("core/edit-post")
          .getEditorMode();
        if (checkVisualedit === "visual") {
          const rootContainer = document.querySelector(".is-root-container");
          if (rootContainer !== null) {
            if ($boardOuter.length >= 1) {
              document.querySelector(".is-root-container").style.width =
                calcLyotWidth + "px";
            } else {
              jQuery(".is-root-container").width(calcLyotWidth);
            }
            if (window.innerWidth > 680) {
              // Set the maximum width to 440px
              rootContainer.style.minWidth = "440px";
            }
          }
        }
      }, 200);

      //Wrapper block suggestion icon wrapup js @author: Minal Diwan @since-3.4
      const wrapperBlockSuggestions = document.querySelectorAll(
        ".cf-wrapperblock__suggestion"
      );

      wrapperBlockSuggestions.forEach((wrapperBlockSuggestion) => {
        const wpBlock = wrapperBlockSuggestion.querySelector(".wp-block");
        const dataAlign = wpBlock?.getAttribute("data-align") || "";
        if (wpBlock?.classList?.contains("alignfull") || dataAlign === "full") {
          wrapperBlockSuggestion.style.maxWidth = "none";
          wrapperBlockSuggestion.style.cssFloat = "none";
        } else if (
          wpBlock?.classList?.contains("alignleft") ||
          dataAlign === "left"
        ) {
          wrapperBlockSuggestion.style.maxWidth = "none";
          wrapperBlockSuggestion.style.cssFloat = "left";
        } else if (
          wpBlock?.classList?.contains("alignright") ||
          dataAlign === "right"
        ) {
          wrapperBlockSuggestion.style.maxWidth = "none";
          wrapperBlockSuggestion.style.cssFloat = "right";
        } else if (
          wpBlock?.classList?.contains("alignwide") ||
          dataAlign === "wide"
        ) {
          wrapperBlockSuggestion.style.maxWidth = "1000px";
          wrapperBlockSuggestion.style.cssFloat = "none";
        }
      });

      if (isSavingPost) {
        checked = false;
      } else {
        if (!checked && !isAutosavingPost) {
          if (didPostSaveRequestSucceed) {
            _this.setState({
              threads: [],
            });

            _this.getComments();
            _this.addActiveClassOnPostStatusChange();
          }
          checked = true;
        }
      }
    });
  }

  /**
   * Comment toggle for whole block
   */
  hideBlockLevelComment(isHideComment) {
    if (isHideComment) {
      var $cfIcons = $(".cf-icon-wholeblock__comment[data-suggestion_id]");
      $cfIcons.each(function () {
        var $cfIcon = $(this);
        var suggestionId = $cfIcon.data("suggestion_id");
        var $matchedElements = $('[suggestion_id="' + suggestionId + '"]');

        // Add classes based on the presence of specific classes on the matched elements
        $matchedElements.each(function () {
          var $matchedElement = $(this);
          if ($matchedElement.hasClass("blockAdded")) {
            $cfIcon.addClass("cf-icon__addBlocks");
          } else if ($matchedElement.hasClass("blockremove")) {
            $cfIcon.addClass("cf-icon__removeBlocks");
          }
          $cfIcon.removeClass("cf-icon-wholeblock__comment");
        });
      });
    } else if (!isHideComment) {
      var $cfIcons = $(
        ".cf-icon__addBlocks[datatext], .cf-icon__removeBlocks[datatext]"
      );
      $cfIcons.each(function () {
        var $cfIcon = $(this);
        var datatextId = $cfIcon.attr("datatext");
        var $matchedElements = $('[datatext="' + datatextId + '"]');

        $matchedElements.each(function () {
          $cfIcon.addClass("cf-icon-wholeblock__comment");
        });
        $cfIcon.removeClass("cf-icon__addBlocks cf-icon__removeBlocks");
      });
    }
  }

  /**
   * Handle Show Comments
   */
  handleShowComments() {
    var openBoards = $(".cls-board-outer").length;
    if (true === wp.data.select("mdstore").getShowComments()) {
      $("body").addClass("hide-comments");
      //$( 'body' ).removeClass( 'commentOn' );
      jQuery.event.trigger({ type: "editorLayoutUpdate" });

      if ($(".cls-board-outer.cm-board.focus").length > 0) {
        wp.data.dispatch("mdstore").setDataText("");
      }

      $("#cf-span__comments .cls-board-outer.cm-board").removeClass("focus");
      $("#cf-span__comments .cls-board-outer.cm-board").removeClass("is-open");
      $("#cf-span__comments .cls-board-outer.cm-board").removeAttr("style");
      $("mdspan").removeAttr("data-rich-text-format-boundary");

      this.setState({
        showComments: wp.data.dispatch("mdstore").setShowComments(false),
      });
      cf_removeAllNotices();
      wp.data.dispatch("core/notices").createNotice(
        "success", // Can be one of: success, info, warning, error.
        __("Comments are Hidden", "content-collaboration-inline-commenting"), // Text string to display.
        {
          id: "hideComments",
          type: "snackbar",
          isDismissible: true, // Whether the user can dismiss the notice.
          // Any actions the user can perform.
        }
      );
      this.hideBlockLevelComment(true);
    } else {
      $("body").removeClass("hide-comments");
      if (0 === openBoards) {
        jQuery.event.trigger({ type: "editorLayoutUpdate" });
      } else {
        jQuery.event.trigger({ type: "editorLayoutUpdate" });
        $(".comment-toggle .components-form-toggle").removeClass("is-checked");
      }
      this.setState({
        showComments: wp.data.dispatch("mdstore").setShowComments(true),
      });
      cf_removeAllNotices();
      wp.data.dispatch("core/notices").createNotice(
        "success", // Can be one of: success, info, warning, error.
        __("Comments are Visible", "content-collaboration-inline-commenting"), // Text string to display.
        {
          id: "showComments",
          type: "snackbar",
          isDismissible: true, // Whether the user can dismiss the notice.
          // Any actions the user can perform.
        }
      );
      this.hideBlockLevelComment(false); // Resolved toggle functionality #584 @author - Mayank / since 3.6
    }
    if ($(".cls-board-outer.focus").length > 0) {
      $("#cf-span__comments .cls-board-outer:not(.focus)").css("opacity", 0.4);
    } else {
      $("#cf-span__comments .cls-board-outer:not(.focus)").css("opacity", 1);
      $("#cf-span__comments .cls-board-outer:not(.focus)").css("top", "auto");
    }
  }

  /**
   * Appned Counter on Activity Center.
   */
  appendCounter() {
    wp.data.subscribe(function () {
      var isPluginSidebarOpen = wp.data
        .select("core/edit-post")
        .isPluginSidebarOpened();
      var isEditorSidebarOpen = wp.data
        .select("core/edit-post")
        .isEditorSidebarOpened();
      if (isPluginSidebarOpen && !isEditorSidebarOpen) {
        /**SGEDIT*/
        // var openBoards = $('.cls-board-outer').length;
        /**SGEDIT*/
        var openBoards;
        openBoards = $(".cls-board-outer").length;

        setTimeout(function () {
          if ($("#history-toggle").length <= 0) {
            if (0 === openBoards) {
              //$('body').removeClass("commentOn");
              jQuery.event.trigger({ type: "editorLayoutUpdate" });
            }
            const notificationCounter = `<span id="history-toggle" data-test="testing" data-count="${openBoards}"></span>`;
            $(".cf-sidebar-activity-centre").append(
              DOMPurify.sanitize(notificationCounter)
            ); // phpcs:ignore
          }
        }, 300);

        /**SGEDIT*/
        if ($("#history-toggle").length > 0) {
          $("#history-toggle").attr("data-count", openBoards);
        }
        /**SGEDIT*/
      }
    });
  }

  /**
   * Add active class in activities thread on selected text click.
   */
  activeBoardOnSelectedText() {
    $(document.body).on("click", ".mdspan-comment", function () {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const current_url = urlParams.get("current_url");
      if (current_url) {
        urlParams.delete("current_url");
        window.history.replaceState(
          {},
          "",
          `${location.pathname}?${urlParams}`
        );
      }

      var datatext = $(this).attr("datatext");
      $(".cf-activity-centre .user-data-row ").removeClass("active");
      $(`#cf-${datatext}`).addClass("active");
      wp.data.dispatch("mdstore").setDataText(datatext);
    });
  }

  /**
   * React lifecycle method that runs after the component mounts.
   * This is where you would initialize anything needed for the component.
  */
  componentDidMount() {
    this.collapseBoardOnMobile();
    this.getComments(); // Calling getComments() to get the comments related to this post.
    this.isPostUpdated(); // Calling isPostUpdated() when the post saving status chagned.
    this.appendCounter(); // Appending counter.
    this.activeBoardOnSelectedText(); // Add active class in activities thread on selected text click.
  }

  /**
   * React lifecycle method that runs after the component updates. 
   * This is where you can perform any operations needed after a component update, 
   * such as fetching new data.
  */
  componentDidUpdate() {
    this.setUserFlag = false;
    document.addEventListener("click", (event) => {
      if (
        event.target.classList.contains("invitation-send-btn") ||
        event.target.classList.contains("invitation-done-btn")
      ) {
        if (!this.setUserFlag) {
            this.setUserFlag = true;
        }
      }
    });
  }

  /**
   * React component render method. 
   * This runs each time the component updates.
   * Where you return the JSX to render the component.
  */
  render() {
    let isEditingTemplate = wp.data
      .select("core/edit-post")
      .isEditingTemplate();
    //check Editingtemplate mode
    if (isEditingTemplate) {
      return null;
    } else {
      const {
        threads,
        isLoading,
        collapseLimit,
        hasAccordian,
        hasAccordianComments,
      } = this.state;

      this.postStatus = wp.data.select("core/editor").getCurrentPost().status;
      //check thread id is available in editor?
      let newThreads = [];
      var iframe = jQuery(".wp-block-post-content iframe")
        .contents()
        .find(
          ".wp-block mdspan,.wp-block .mdadded,.wp-block .mdmodified,.wp-block .mdremoved,.commentIcon, .cf-onwhole-block__comment"
        );
      if (isEditingTemplate || iframe.length > 0) {
        iframe.each(function () {
          let selectedText = $(this).attr("datatext");
          let obj = { elID: selectedText };
          newThreads.push(obj);
        });
      } else {
        $(".commentIcon , .cf-onwhole-block__comment, .wp-block mdspan").each(
          function () {
            let selectedText = $(this).attr("datatext");
            let obj = { elID: selectedText };
            newThreads.push(obj);
          }
        );
      }
      var threadsId = [],
        newThreadsId = [],
        commentAutoDrafts = 0;

      if (newThreads !== null && threads !== null && threads !== undefined) {
        threads.map((th) => {
          if (th.resolved === "false") {
            threadsId.push(th.elID);
          }
        });
        newThreads.map((newTh) => {
          newThreadsId.push(newTh.elID);
        });

        var newThreadsIdSet = new Set(newThreadsId);
        var setDifference = [...threadsId].filter(
          (x) => !newThreadsIdSet.has(x)
        );
        setDifference.map((setDiff) => {
          if (setDiff.match(/el/g)) {
            commentAutoDrafts++;
          }
        });
      }

      if ($(".cls-board-outer.focus").length > 0) {
        $("#cf-span__comments .cls-board-outer:not(.focus)").css(
          "opacity",
          0.4
        );
      } else {
        $("#cf-span__comments .cls-board-outer:not(.focus)").css("opacity", 1);
        $("#cf-span__comments .cls-board-outer:not(.focus)").css("top", "auto");
      }

      jQuery.event.trigger({ type: "editorLayoutUpdate" });

      // Added condition using mdstore to check user's capability @uathor - Mayank / since 3.6
      let userCapability = wp.data.select("mdstore").getUserCapability();
      if (userCapability && ('commenter' === userCapability?.capability || 'coeditor'  === userCapability?.capability)) {
        isCommentor = true;
      } else {
        isCommentor = false;
      }
      let activeUsers = wp.data.select(
        "multiedit/block-collab/add-block-selections"
      )
        ? wp.data
            .select("multiedit/block-collab/add-block-selections")
            .getState()
        : [];
      let permittedValues = Array.from(activeUsers).map(
        (value) => value.userId
      );
      permittedValues = permittedValues.filter((value, index, self) => {
        return self.indexOf(value) === index;
      });
      permittedValues = permittedValues.sort();
      let userClass = "";
      let userColor = "";
      if (
        permittedValues.some((obj) =>
          Object.keys(obj).includes(this.state.usersWithAccess?.owner?.user_id)
        )
      ) {
        userClass = "user-online";
        userColor = permittedValues.find(
          (obj) => this.state.usersWithAccess?.owner?.user_id in obj
        );
        userColor = userColor[this.state.usersWithAccess?.owner?.user_id];
      } else {
        userClass = "user-offline";
        userColor = "#a2a2a2";
      }

      var realtimecollaborator = wp.data
      .select("core/editor")
      .getEditedPostAttribute("meta")?._realtime_collaborators;
      
      if( realtimecollaborator ) {

        realtimecollaborator = JSON.parse( realtimecollaborator );
        var realtimecollaboratorArray = Object.values( realtimecollaborator );

        // To sort realtime collaborator array to display online user first.
        var realtimecollaboratorArraySort = [];
        realtimecollaboratorArray.map(
          (item, index) => {
            if (
              permittedValues.some((obj) =>
                Object.keys(obj).includes(
                  item?.userId?.toString()
                )
              )
            ) {
              realtimecollaboratorArraySort.push( realtimecollaboratorArray[index] );
              delete realtimecollaboratorArray[index];
            }
          }
        )

        realtimecollaboratorArray.filter((a) => a);
        var realtimecollaboratorMergeResult = realtimecollaboratorArraySort.concat(realtimecollaboratorArray);
        realtimecollaboratorMergeResult = realtimecollaboratorMergeResult.filter(element => {
          return element !== null;
        });

      }

       // Fix github issue: 889.
       setTimeout(() => {
        var allCommentBoards = document.querySelectorAll( '.user-data-row' );
        var emptyActivityThreads = false;
        if( 0 === allCommentBoards.length ) {
          emptyActivityThreads = true;
        }
        var emptyActivityThreadsMsg = document.querySelector('.js-activity-centre');
        if( true === emptyActivityThreads && emptyActivityThreadsMsg ) {
          emptyActivityThreadsMsg.innerHTML = '<div class="user-data-row"><strong>No recent activities found!</strong></div>';
        }
        
      }, 200);

      /* edited the new tab for summary. */
      return (
        <Fragment>
          <PluginSidebarMoreMenuItem target="cf-activity-center">
            {__("Multicollab", "cf-activity-center")}
          </PluginSidebarMoreMenuItem>
          <PluginSidebar
            name="cf-activity-center"
            title={__(`Multicollab`, "cf-activity-center")}
          >

            <TabPanel
              className="my-tab-panel"
              tabs={[
                {
                  name: "cf-activity-centre",
                  title: (
                    <span className="cf-activity-centre-tab-title">
                      {__(
                        "Activities",
                        "content-collaboration-inline-commenting"
                      )}
                    </span>
                  ),
                  className: "cf-sidebar-activity-centre",
                },
                {
                  name: "cf-settings",
                  title: (
                    <span className="cf-settings-tab-title">
                      {__(
                        "Settings",
                        "content-collaboration-inline-commenting"
                      )}
                    </span>
                  ),
                  className: "cf-sidebar-settings",
                },
                {
                  name: "cf-comment-summary",
                  title: (
                    <span className="cf-comment-summary-tab-title">
                      {__("Summary", "content-collaboration-inline-commenting")}
                    </span>
                  ),
                  className: "cf-sidebar-comment-summary",
                },
              ]}
            >
              {(tab) => {
                if (
                  "cf-activity-centre" === tab.name &&
                  $(".cf-activity-centre-tab-title").css("display", "block")
                  // &&
                  // $(".cf-settings-tab-title").css("display", "none") &&
                  // $(".cf-comment-summary-tab-title").css("display", "none")
                ) {
                  return (
                    <div className="cf-activity-centre js-activity-centre">
                      {null === threads && (
                        <div className="user-data-row">
                          <strong>
                            {__(
                              "No recent activities found!",
                              "content-collaboration-inline-commenting"
                            )}
                          </strong>
                        </div>
                      )}

                      {true === isLoading && (
                        <div className="user-data-row">
                          <strong>
                            {__(
                              "Loading...",
                              "content-collaboration-inline-commenting"
                            )}
                          </strong>
                        </div>
                      )}

                      {undefined !== threads &&
                        null !== threads &&
                        threads.map((th) => {
                          //check thread id is available in editor?
                          var removedItem =
                            newThreads.filter((x) => x.elID === th.elID)
                              .length > 0
                              ? false
                              : true;
                          if (th.resolved === "true") {
                            removedItem = false;
                          }

                          if (removedItem) {
                            return;
                          }
                          var boardId = wp.data.select("mdstore").getDataText();
                          return (
                            <div
                              className={
                                ("true" === th.resolved
                                  ? "user-data-row cf-thread-resolved"
                                  : "user-data-row") +
                                (th.elID === boardId && "true" !== th.resolved
                                  ? " active"
                                  : "") +
                                (removedItem ? " unknownThread" : "") +
                                  (th.type === "sg" ? " sglog" : th.type === "el" ? " cmlog" : " cblog")
                              }
                              id={`cf-${`${th.elID}`}`}
                              key={`cf-${`${th.elID}`}`}
                            >
                              {th.activities.map((c, index) => {
                                return (
                                  <div
                                    className={
                                      0 < index
                                        ? "user-data-box user-reply"
                                        : "user-data-box"
                                    }
                                    key={index}
                                    style={{
                                      display:
                                        index >= getCommentsLimit()
                                          ? "none"
                                          : "",
                                    }}
                                  >
                                    <div className="user-data">
                                      <div className="user-data-header">
                                        <div className="user-avatar">
                                          <img
                                            src={c.userData.avatarUrl}
                                            alt={c.userData.username}
                                          />
                                        </div>
                                        <div className="user-display-name">
                                          <span class="user-name">
                                            {c.userData?.username.charAt(0).toUpperCase() +
                                             c.userData?.username.slice(1)}{" "}
                                            <span className="tooltip">
                                              {c.userData?.userRole.charAt(0).toUpperCase() +
                                                c.userData?.userRole.slice(1)}{" "}
                                            </span>{" "}
                                          </span>
                                          {"deleted" === c.status &&
                                          th.type === "el" &&
                                          "" !== c.created_at ? (
                                            <time class="user-commented-date">
                                              <span>
                                                {timeAgo(c.created_at)}
                                              </span>
                                              <span className="tooltip">
                                                {convertedDatetime(
                                                  c.created_at.toString()
                                                )}
                                              </span>
                                            </time>
                                          ) : (
                                            <time class="user-commented-date">
                                              <span>{timeAgo(c.id)}</span>
                                              <span className="tooltip">
                                                {convertedDatetime(
                                                  c.id.toString()
                                                )}
                                              </span>
                                            </time>
                                          )}
                                        </div>
                                      </div>
                                      <div className="user-data-wrapper">
                                        <div className="user-commented-on">
                                          {0 >= index && (
                                            <React.Fragment>
                                              <blockquote
                                                className={
                                                  "user-commented-icon" +
                                                  (th.blockType
                                                    ? "-" + th.blockType
                                                    : "") +
                                                  (th.action &&
                                                  th.action.toLowerCase() ===
                                                    "delete"
                                                    ? " delete"
                                                    : " add")
                                                }
                                              >
                                                {"deleted" === c.status ||
                                                "true" === th.resolved ? (
                                                  <React.Fragment>
                                                    {th.type === "sg" ? (
                                                      <React.Fragment>
                                                        <span
                                                          id={`show-all-${c.id}`}
                                                          class="user-commented-on show-all js-hide "
                                                          data-id={`cf-${th.elID}`}
                                                        >
                                                          {renderHTML(
                                                            sprintf(
                                                              "<strong>%s</strong> : %s",
                                                              __(
                                                                th.action,
                                                                "content-collaboration-inline-commenting"
                                                              ),
                                                              __(
                                                                th.selectedText,
                                                                "content-collaboration-inline-commenting"
                                                              )
                                                            )
                                                          )}
                                                        </span>
                                                        <span
                                                          id={`show-less-${c.id}`}
                                                          class="user-commented-on show-less"
                                                          data-id={`cf-${th.elID}`}
                                                        >
                                                          {renderHTML(
                                                            this.collapseText(
                                                              sprintf(
                                                                "<strong>%s</strong> : %s",
                                                                __(
                                                                  th.action,
                                                                  "content-collaboration-inline-commenting"
                                                                ),
                                                                __(
                                                                  th.selectedText,
                                                                  "content-collaboration-inline-commenting"
                                                                )
                                                              )
                                                            )
                                                          )}
                                                        </span>
                                                      </React.Fragment>
                                                    ) : (
                                                      <React.Fragment>
                                                        <span
                                                          id={`show-all-${c.id}`}
                                                          class="user-commented-on show-all js-hide "
                                                          data-id={`cf-${th.elID}`}
                                                        >
                                                          {renderHTML(
                                                            th.selectedText
                                                          )}
                                                        </span>
                                                        <span
                                                          id={`show-less-${c.id}`}
                                                          class="user-commented-on show-less"
                                                          data-id={`cf-${th.elID}`}
                                                        >
                                                          {renderHTML(
                                                            this.collapseText(
                                                              th.selectedText
                                                            )
                                                          )}
                                                        </span>
                                                      </React.Fragment>
                                                    )}

                                                    {null !== th.selectedText &&
                                                      collapseLimit <=
                                                        th.selectedText.replace(
                                                          /<\/?[^>]+(>|$)/g,
                                                          ""
                                                        ).length && (
                                                        <a
                                                          href="javascript:void(0)"
                                                          className="cf-show-more"
                                                          data-id={c.id}
                                                          onClick={this.toggleCollapseLink.bind(
                                                            this
                                                          )}
                                                        >
                                                          {__(
                                                            "Show more",
                                                            "content-collaboration-inline-commenting"
                                                          )}
                                                        </a>
                                                      )}
                                                  </React.Fragment>
                                                ) : (
                                                  <React.Fragment>
                                                    {th.type === "sg" ? (
                                                      <React.Fragment>
                                                        <a
                                                          id={`show-all-${c.id}`}
                                                          class="user-commented-on show-all js-hide "
                                                          data-elid={`cf-${th.elID}`}
                                                          href="javascript:void(0)"
                                                          onClick={this.reply.bind(
                                                            this
                                                          )}
                                                        >
                                                          {renderHTML(
                                                            sprintf(
                                                              "<strong>%s</strong> : %s",
                                                              __(
                                                                th.action,
                                                                "content-collaboration-inline-commenting"
                                                              ),
                                                              __(
                                                                th.selectedText,
                                                                "content-collaboration-inline-commenting"
                                                              )
                                                            )
                                                          )}
                                                        </a>
                                                        <a
                                                          id={`show-less-${c.id}`}
                                                          class="user-commented-on show-less"
                                                          data-elid={`cf-${th.elID}`}
                                                          href="javascript:void(0)"
                                                          onClick={this.reply.bind(
                                                            this
                                                          )}
                                                        >
                                                          {renderHTML(
                                                            this.collapseText(
                                                              sprintf(
                                                                "<strong>%s</strong> : %s",
                                                                __(
                                                                  th.action,
                                                                  "content-collaboration-inline-commenting"
                                                                ),
                                                                __(
                                                                  th.selectedText,
                                                                  "content-collaboration-inline-commenting"
                                                                )
                                                              )
                                                            )
                                                          )}
                                                        </a>
                                                      </React.Fragment>
                                                    ) : (
                                                      <React.Fragment>
                                                        <a
                                                          id={`show-all-${c.id}`}
                                                          class="user-commented-on show-all js-hide "
                                                          data-elid={`cf-${th.elID}`}
                                                          href="javascript:void(0)"
                                                          onClick={this.reply.bind(
                                                            this
                                                          )}
                                                        >
                                                          {renderHTML(
                                                            th.selectedText
                                                          )}
                                                        </a>
                                                        <a
                                                          id={`show-less-${c.id}`}
                                                          class="user-commented-on show-less"
                                                          data-elid={`cf-${th.elID}`}
                                                          href="javascript:void(0)"
                                                          onClick={this.reply.bind(
                                                            this
                                                          )}
                                                        >
                                                          {renderHTML(
                                                            this.collapseText(
                                                              th.selectedText
                                                            )
                                                          )}
                                                        </a>
                                                      </React.Fragment>
                                                    )}

                                                    {null !== th.selectedText &&
                                                      collapseLimit <=
                                                        th.selectedText.replace(
                                                          /<\/[^>]+(>|$)/g,
                                                          ""
                                                        ).length && (
                                                        <a
                                                          href="javascript:void(0)"
                                                          className="cf-show-more"
                                                          data-id={c.id}
                                                          onClick={this.toggleCollapseLink.bind(
                                                            this
                                                          )}
                                                        >
                                                          {__(
                                                            "Show more",
                                                            "content-collaboration-inline-commenting"
                                                          )}
                                                        </a>
                                                      )}
                                                  </React.Fragment>
                                                )}
                                              </blockquote>
                                            </React.Fragment>
                                          )}
                                        </div>
                                        <div class="user-comment">
                                          {0 < index &&
                                          "deleted" === c.status ? (
                                            <del>{renderHTML(c.thread)}</del> // phpcs:ignore
                                          ) : (
                                            <span> {renderHTML(c.thread)}</span> // phpcs:ignore
                                          )}
                                        </div>

                                        {c.editedTime &&
                                          c.editedTime.length > 0 &&
                                          "deleted" !== c.status &&
                                          th.type === "el" && (
                                            <time class="user-commented-date user-inner-box-time">
                                              {" "}
                                              {sprintf(
                                                __(
                                                  "edited %s",
                                                  "content-collaboration-inline-commenting"
                                                ),
                                                timeAgo(c.editedTimestamp)
                                              )}{" "}
                                              <span className="tooltip">
                                                {c.editedTime}
                                              </span>
                                            </time>
                                          )}
                                        {0 >= index &&
                                          undefined !==
                                            th.assignedTo.username && (
                                            <div class="user-assigned-to">
                                              <span class="icon"></span>
                                              <span class="assign-avatar-data">
                                                {__(
                                                  "Assigned to",
                                                  "content-collaboration-inline-commenting"
                                                )}
                                                <a
                                                  href={`mailto:${th.assignedTo.email}`}
                                                  title={th.assignedTo.username}
                                                >
                                                  {" "}
                                                  {th.assignedTo.username}
                                                </a>
                                              </span>
                                            </div>
                                          )}
                                        {"true" !== th.resolved && "deleted" !== c.status && ( // Add deleted status condition to resolve Github issue: 755
                                          <div className="user-action">
                                            {0 >= index && (
                                              <React.Fragment>
                                                <a
                                                  href="javascript:void(0)"
                                                  className="user-cmnt-reply last-cmt-text"
                                                  data-elid={`cf-${th.elID}`}
                                                  onClick={this.reply.bind(
                                                    this
                                                  )}
                                                >
                                                  {__(
                                                    "Reply",
                                                    "content-collaboration-inline-commenting"
                                                  )}
                                                  <span className="tooltip">
                                                    {__(
                                                      "Reply to this comment",
                                                      "content-collaboration-inline-commenting"
                                                    )}
                                                  </span>
                                                </a>
                                                {th.type !== "sg" &&
                                                  !isCommentor && (
                                                    <a
                                                      href="javascript:void(0)"
                                                      className="user-thread-resolve js-resolve-comment last-cmt-text"
                                                      onClick={this.resolveThread.bind(
                                                        this
                                                      )}
                                                      data-elid={`cf-${th.elID}`}
                                                    >
                                                      {__(
                                                        "Resolve",
                                                        "content-collaboration-inline-commenting"
                                                      )}
                                                      <span className="tooltip">
                                                        {" "}
                                                        {__(
                                                          "Mark as Resolved",
                                                          "content-collaboration-inline-commenting"
                                                        )}
                                                      </span>
                                                    </a>
                                                  )}
                                              </React.Fragment>
                                            )}
                                            {0 < index &&
                                              parseInt(
                                                this.currentUserID,
                                                10
                                              ) === c.userData.id && (
                                                <React.Fragment>
                                                  <a
                                                    href="javascript:void(0)"
                                                    className="user-cmnt-reply"
                                                    data-elid={`cf-${th.elID}`}
                                                    data-editid={c.id}
                                                    onClick={this.edit.bind(
                                                      this
                                                    )}
                                                  
                                                  >
                                                    {__(
                                                      "Edit",
                                                      "content-collaboration-inline-commenting"
                                                    )}
                                                    <span className="tooltip">
                                                      {__(
                                                        "Edit",
                                                        "content-collaboration-inline-commenting"
                                                      )}
                                                    </span>
                                                  </a>

                                                  <a
                                                    href="javascript:void(0)"
                                                    className="user-cmnt-delete"
                                                    data-elid={`cf-${th.elID}`}
                                                    data-deleteid={c.id}
                                                    onClick={this.delete.bind(
                                                      this
                                                    )}
                                                  
                                                  >
                                                    {__(
                                                      "Delete",
                                                      "content-collaboration-inline-commenting"
                                                    )}
                                                    <span className="tooltip">
                                                      {__(
                                                        "Delete",
                                                        "content-collaboration-inline-commenting"
                                                      )}
                                                    </span>
                                                  </a>
                                                </React.Fragment>
                                              )}{" "}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {th.activities.length > getCommentsLimit() && (
                                <div className="show-all-comments">
                                  {" "}
                                  {sprintf(
                                    __("Show all %d replies"),
                                    th.activities.length - 1
                                  )}{" "}
                                </div>
                              )}
                              {"true" === th.resolved &&
                                undefined !== th.resolvedBy && (
                                  <div className="user-data-box cf-mark-as-resolved">
                                    <div className="user-data">
                                      <div className="user-data-header">
                                        <div className="user-avatar">
                                          <img
                                            src={th.resolvedBy.avatarUrl}
                                            alt={th.resolvedBy.username}
                                          />
                                        </div>
                                        <div className="user-display-name">
                                          <span class="user-name">
                                            {th.resolvedBy.username}{" "}
                                          </span>
                                          {th.type === "sg" && (
                                            <time class="user-commented-date">
                                              {timeAgo(
                                                th.resolvedBy
                                                  .sgResolvedTimestamp
                                              )}
                                              <span className="tooltip">
                                                {convertedDatetime(
                                                  th.resolvedTimestamp
                                                )}
                                              </span>
                                            </time>
                                          )}
                                          {th.type === "el" && (
                                            <time class="user-commented-date">
                                              {timeAgo(th.updatedAt)}
                                              <span className="tooltip">
                                                {convertedDatetime(
                                                  th.resolvedTimestamp
                                                )}
                                              </span>
                                            </time>
                                          )}
                                        </div>
                                      </div>
                                      <div className="cf-mark-as-user-data">
                                        {th.type !== "sg" && (
                                          <div className="user-comment mark-resolved-icon">
                                            <strong>
                                              {__(
                                                "Marked as Resolved",
                                                "content-collaboration-inline-commenting"
                                              )}{" "}
                                            </strong>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          );
                        })}
                    </div>
                  );
                }
                if (
                  "cf-settings" === tab.name &&
                  // $(".cf-activity-centre-tab-title").css("display", "none") &&
                  $(".cf-settings-tab-title").css("display", "block")
                  // &&
                  // $(".cf-comment-summary-tab-title").css("display", "none")
                ) {
                  return (
                    <div className="cf-settings-tab">
                      <PanelBody>
                        <ToggleControl
                          label={__(
                            "Hide Comments",
                            "content-collaboration-inline-commenting"
                          )}
                          className="comment-toggle"
                          help={__(
                            "When enabled, all the comment boxes will disappear to provide a non-distracted editing experience. You can still add a comment to your post.",
                            "content-collaboration-inline-commenting"
                          )}
                          checked={!wp.data.select("mdstore").getShowComments()}
                          onChange={this.handleShowComments.bind(this)}
                        />
                      </PanelBody>
                    </div>
                  );
                }
                if (
                  "cf-comment-summary" === tab.name &&
                  // $(".cf-activity-centre-tab-title").css("display", "none") &&
                  // $(".cf-settings-tab-title").css("display", "none") &&
                  $(".cf-comment-summary-tab-title").css("display", "block")
                ) {
                  var resolveCounts = 0,
                    opencmntsCounts = 0,
                    userCounter = "",
                    storeUserCounter = "",
                    lastUser = "",
                    diff = "",
                    uniqueChars = [],
                    lastUserProfile = "",
                    counterArr = [],
                    counterIndex = 0,
                    userImages = "",
                    userRoles = "",
                    userFullInfo = "",
                    totalComments = 0;
                  var threadsOrgLength = null === threads ? 0 : threads.length;

                  return (
                    <div className="cf-summary">
                      {null === threads && (
                        <div className="comment-summary-row">
                          <div
                            className={
                              true === hasAccordian
                                ? "summary-accordion active-accordion"
                                : "summary-accordion"
                            }
                            onClick={() => {
                              this.setState({ hasAccordian: !hasAccordian });
                            }}
                          >
                            <span>
                              {__(
                                "Comments",
                                "content-collaboration-inline-commenting"
                              )}
                            </span>
                            {true === hasAccordian ? (
                              <span>
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="components-panel__arrow"
                                  role="img"
                                  aria-hidden="true"
                                  focusable="false"
                                >
                                  <path d="M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z"></path>
                                </svg>
                              </span>
                            ) : (
                              <span>
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="components-panel__arrow"
                                  role="img"
                                  aria-hidden="true"
                                  focusable="false"
                                >
                                  <path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path>
                                </svg>
                              </span>
                            )}
                          </div>
                          <section>
                            {true === hasAccordian && (
                              <div>
                                <label className="comments-row">
                                  {__(
                                    "Total Comments",
                                    "content-collaboration-inline-commenting"
                                  )}{" "}
                                  <span>0</span>
                                </label>
                                <label className="comments-row">
                                  {__(
                                    "Open Comments",
                                    "content-collaboration-inline-commenting"
                                  )}{" "}
                                  <span>0</span>
                                </label>
                                <label className="comments-row">
                                  {__(
                                    "Resolved Comments",
                                    "content-collaboration-inline-commenting"
                                  )}{" "}
                                  <span>0</span>
                                </label>
                              </div>
                            )}
                          </section>
                        </div>
                      )}

                      {true === isLoading && (
                        <div className="comment-summary-row">
                          <strong>
                            {__(
                              "Loading...",
                              "content-collaboration-inline-commenting"
                            )}
                          </strong>
                        </div>
                      )}
                      {false === isLoading &&
                        undefined !== threads &&
                        null !== threads && (
                          <section>
                            <div className="last-activity-section">
                              <div className="comment-summary-last-activity-section">
                                {__(
                                  "Last Edited By",
                                  "content-collaboration-inline-commenting"
                                )}{" "}
                              </div>
                              {threads.slice(0, 1).map((th) => {
                                if (
                                  th.resolved === "false" &&
                                  th.type === "el" &&
                                  th.type !== undefined
                                ) {
                                  th.activities.map((activity) => {
                                    var afterChngThread = threads.length;
                                    lastUserProfile =
                                      threadsOrgLength === afterChngThread
                                        ? th.lastUsersUrl
                                        : activity.userData.avatarUrl;
                                    lastUser = th.lastUser;
                                    var cmtEditedTime =
                                      threadsOrgLength === afterChngThread
                                        ? th.lastEditedTime
                                        : th.updatedAt;
                                    diff =
                                      th.lastEditedTime !== undefined ||
                                      activity.timestamp !== undefined
                                        ? timeAgo(cmtEditedTime)
                                        : "";
                                  });
                                  return (
                                    <div className="last-activity-row" key={th}>
                                      <span className="summary-user-avatar">
                                        <img
                                          src={lastUserProfile}
                                          alt={lastUser}
                                        />
                                      </span>
                                      <span className="user-avtar-details">
                                        <span className="lastuser-name">
                                          {lastUser}
                                        </span>
                                        <span className="last-edited-time">
                                          {diff}
                                        </span>
                                      </span>
                                    </div>
                                  );
                                }
                                if (
                                  th.resolved === "true" &&
                                  th.type === "el" &&
                                  th.type !== undefined
                                ) {
                                  var afterChngThread = threads.length;
                                  lastUserProfile =
                                    threadsOrgLength === afterChngThread
                                      ? th.lastUsersUrl
                                      : th.resolvedBy.avatarUrl;
                                  lastUser = th.lastUser;
                                  var resvEditedTime =
                                    threadsOrgLength === afterChngThread
                                      ? th.lastEditedTime
                                      : th.updatedAt;
                                  diff =
                                    th.lastEditedTime !== undefined ||
                                    th.resolvedTimestamp !== undefined
                                      ? timeAgo(resvEditedTime)
                                      : "";
                                  return (
                                    <div className="last-activity-row" key={th}>
                                      <span className="summary-user-avatar">
                                        <img
                                          src={lastUserProfile}
                                          alt={lastUser}
                                        />
                                      </span>
                                      <span className="user-avtar-details">
                                        <span className="lastuser-name">
                                          {lastUser}
                                        </span>
                                        <span className="last-edited-time">
                                          {diff}
                                        </span>
                                      </span>
                                    </div>
                                  );
                                }
                              })}
                            </div>

                            <div
                              className={
                                false === hasAccordianComments
                                  ? "summary-accordion active-accordion"
                                  : "summary-accordion"
                              }
                              onClick={() => {
                                this.setState({
                                  hasAccordianComments: !hasAccordianComments,
                                });
                              }}
                            >
                              <span>
                                {__(
                                  "Comments",
                                  "content-collaboration-inline-commenting"
                                )}
                              </span>
                              {true === hasAccordianComments ? (
                                <span>
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="components-panel__arrow"
                                    role="img"
                                    aria-hidden="true"
                                    focusable="false"
                                  >
                                    <path d="M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z"></path>
                                  </svg>
                                </span>
                              ) : (
                                <span>
                                  <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="components-panel__arrow"
                                    role="img"
                                    aria-hidden="true"
                                    focusable="false"
                                  >
                                    <path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></path>
                                  </svg>
                                </span>
                              )}
                            </div>

                            {false === hasAccordianComments && (
                              <div className="accordian-panel">
                                <div className="comments-row">
                                  <label className="comment-summary-total-comments">
                                    {__(
                                      "Total Comments",
                                      "content-collaboration-inline-commenting"
                                    )}
                                  </label>
                                  {
                                    <div className="opencommentsvalue">
                                      {threads.map((th) => {
                                        if (
                                          th.type === "el" &&
                                          th.type !== undefined
                                        ) {
                                          totalComments++;
                                        }
                                      })}
                                      <span>
                                        {totalComments - commentAutoDrafts}
                                      </span>
                                    </div>
                                  }
                                </div>
                                <div className="comments-row">
                                  <label className="comment-summary-open-comments">
                                    {__(
                                      "Open Comments",
                                      "content-collaboration-inline-commenting"
                                    )}{" "}
                                  </label>
                                  {
                                    <div className="opencommentsvalue">
                                      {threads.map((th) => {
                                        if (
                                          th.resolved !== "true" &&
                                          th.type === "el"
                                        ) {
                                          opencmntsCounts++;
                                        }
                                      })}
                                      <span>
                                        {opencmntsCounts - commentAutoDrafts}
                                      </span>
                                    </div>
                                  }
                                </div>
                                <div className="comments-row">
                                  <label className="comment-summary-resolved-comments">
                                    {__(
                                      "Resolved Comments",
                                      "content-collaboration-inline-commenting"
                                    )}
                                  </label>
                                  {
                                    <div className="resolvedvalue">
                                      {threads.map((th) => {
                                        if (
                                          th.resolved === "true" &&
                                          th.type === "el"
                                        ) {
                                          resolveCounts++;
                                        }
                                      })}
                                      <span>{resolveCounts}</span>
                                    </div>
                                  }
                                </div>
                              </div>
                            )}
                          </section>
                        )}
                    </div>
                  );
                }
              }}
            </TabPanel>
          </PluginSidebar>
        </Fragment>
      );
    }
  }
}

registerPlugin("cf-activity-center", {
  icon: icons.multicollab,
  render: Comments,
});
