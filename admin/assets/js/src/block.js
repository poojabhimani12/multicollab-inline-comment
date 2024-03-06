import Board from "./component/board";
import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import allowedBlocks from "./component/allowedBlocks";
import axios from "axios";
import NonTextComments from "./component/nonTextComments";
import nonTextBlock from "./component/nonTextBlock";
import customAttributes from "./customAttributes";

const { addFilter } = wp.hooks;
const { __ } = wp.i18n;
const { displayShortcut, isKeyboardEvent } = wp.keycodes;
const { Fragment, Component } = wp.element; // eslint-disable-line
const { toggleFormat } = wp.richText; // eslint-disable-line
const { RichTextToolbarButton, BlockControls, RichTextShortcut } =
  wp.blockEditor; // eslint-disable-line
const { registerFormatType, applyFormat, removeFormat } = wp.richText; // eslint-disable-line
const { ToolbarGroup, ToolbarButton } = wp.components; // eslint-disable-line
const { select } = wp.data; // eslint-disable-line
const $ = jQuery; // eslint-disable-line

const NonTextComment = new NonTextComments(); // eslint-disable-line


/**
 * Runs when the window finishes loading.
 */
$(window).on("load", function () {

  let loadAttempts = 0;
  const loadComments = setInterval(function () {
    loadAttempts++;
    if (1 <= $(".block-editor-writing-flow").length) {
      // Clearing interval if found.
      clearInterval(loadComments);
      
      // Fetching comments
      fetchComments();
    }

    setTimeout(function () {
      $.event.trigger({ type: "showHideComments" });
    }, 1000);
    jQuery.event.trigger({ type: "editorLayoutUpdate" });
    // Clearing interval if not found in 10 attemps.
    if (loadAttempts >= 10) {
      clearInterval(loadComments);
    }
  }, 1000);

  // Hide clear formatting button for suggestions. @author: Rishi Shah @since: 3.4
  $(".edit-post-visual-editor").mouseover(function () {
    setTimeout(() => {
      var clearFormattingIcon = document.querySelectorAll(
        '[aria-label="Clear Unknown Formatting"]'
      );
      for (let i = 0; i < clearFormattingIcon.length; i++) {
        clearFormattingIcon[i].style.display = "none";
      }
    }, 100);
  });

  //for Multicollab Sidebar
  const contentBlockList = wp.data.select("core/block-editor").getBlocks();
  /**
   * Checks if any of the blocks in the contentBlockList contain a custom 
   * block by seeing if the block name contains 'core/'.
   * 
   * @returns {boolean} True if a custom block is found, false otherwise.
   */
  const hasCustomBlocks = contentBlockList.some(element => element.name && !element.name.includes("core/"));

  if ('0' !== multicollab_sidebar.cf_show_multicollab_sidebar && !hasCustomBlocks) {
    const sidebarName = wp.data
      .select("core/edit-post")
      .getActiveGeneralSidebarName();
    if (sidebarName !== "cf-activity-center/cf-activity-center") {
      //open multicollab sidebar on load by default
      wp.data
        .dispatch("core/edit-post")
        .openGeneralSidebar("cf-activity-center/cf-activity-center");
    }
  }

});
$(document).ready(function () {

  function updateLeftStyle() {
    if (!$('body').hasClass('is-fullscreen-mode')) {
      $('.cf-board__notice').addClass('is-cf-pressed-not-fullscreen'); // Add the class
    } else {
      $('.cf-board__notice').removeClass('is-cf-pressed-not-fullscreen'); // Remove the class

    }
  }

  updateLeftStyle();

  $(document).on('click', function () {
    updateLeftStyle(); // Update the class when the body class changes
  });
  // Function to add the 'is-cf-pressed' class to cf-board__notice
  function addIsCfPressedClass() {
    const noticeElements = document.getElementsByClassName('cf-board__notice');
    for (const noticeElement of noticeElements) {
      noticeElement.classList.add('is-cf-pressed');
    }
  }

  // Function to remove the 'is-cf-pressed' class from cf-board__notice
  function removeIsCfPressedClass() {
    const noticeElements = document.getElementsByClassName('cf-board__notice');
    for (const noticeElement of noticeElements) {
      noticeElement.classList.remove('is-cf-pressed');
    }
  }

  // Check for the presence of the target class at regular intervals
  setInterval(function () {
    const sidebarElement = document.querySelector('.interface-interface-skeleton__secondary-sidebar');
    const isCfPressed = sidebarElement && sidebarElement.classList.contains('interface-interface-skeleton__secondary-sidebar');

    if (isCfPressed) {
      addIsCfPressedClass(); // Add the 'is-cf-pressed' class
    } else {
      removeIsCfPressedClass(); // Remove the 'is-cf-pressed' class
    }
  }, 100);

});
window.addEventListener("click", function (e) {
  var clickText = $(e.target).text();

  if ("Exit code editor" === clickText || "Visual editor" === clickText) {
    // Fetching comments
    fetchComments();
  }
});


/**
 * Creates floating comment icons that follow the user as they scroll.
 * Focused element is the element that the icons should follow.
 */
function createFloatingIcons(focusedElement) {
  var floatingparentNode = document.createElement("div");
  floatingparentNode.setAttribute("class", "cf-floating__wrapper");
  var floatingNode = document.createElement("div");
  floatingNode.setAttribute("class", "cf-floating__button");
  var floatinglistNode = document.createElement("ul");
  var commentList = document.createElement("li");

  var childcommentList = document.createElement("div");
  childcommentList.setAttribute("class", "admin-comments-holder");
  var tooltipList = document.createElement("span");
  tooltipList.setAttribute("class", "tooltip");
  childcommentList
    .appendChild(tooltipList)
    .append(__("Add Comment", "content-collaboration-inline-commenting"));
  commentList.appendChild(childcommentList);

  var html = getSelectionHtml(); // Check if selected text has comment or not. @author: Rishi Shah
  if (null !== html.match(/mdspan/g)) {
    commentList.setAttribute("already_commented", "true");
  } else {
    commentList.setAttribute("already_commented", "false");
  }

  commentList.addEventListener("click", function () {
    var block = wp.data.select("core/block-editor").getSelectedBlock();
    if (
      "figure" === focusedElement ||
      "video" === focusedElement ||
      "img" === focusedElement ||
      !allowedBlocks.text.includes(block.name)
    ) {
      if ("figcaption" === focusedElement) {
        $(".toolbar-button-with-text").trigger("click");
      } else {
        $(".toolbar-button-with-nontext").trigger("click");
      }
    } else {
      $(".toolbar-button-with-text").trigger("click");
    }

    $(commentList).addClass("float-active");
    $(".cf-floating__wrapper").remove();
  });

  var tooltipsuggList = document.createElement("span");
  tooltipsuggList.setAttribute("class", "tooltip");
  floatinglistNode.appendChild(commentList);

  var referenceNode = document.getElementById(
    "cf-comments-suggestions__parent"
  );
  if (null === referenceNode) {
    createCommentNode();
    var referenceNode = document.getElementById(
      "cf-comments-suggestions__parent"
    );
  }
  floatingNode.appendChild(floatinglistNode);
  floatingparentNode.appendChild(floatingNode);
  referenceNode.appendChild(floatingparentNode);
}

/**
 * Fetches comments from the server.
 */
function fetchComments() {
  var parentNode = document.createElement("div");
  parentNode.setAttribute("id", "cf-comments-suggestions__parent");
  var referenceNode = document.querySelector(".block-editor-writing-flow");
  if (null !== referenceNode) {
    referenceNode.appendChild(parentNode);

    var commentNode = document.createElement("div");
    commentNode.setAttribute("id", "cf-span__comments");
    commentNode.setAttribute("class", "comments-loader");
    var parentNodeRef = document.getElementById(
      "cf-comments-suggestions__parent"
    );
    parentNodeRef.appendChild(commentNode);
    showNoticeBoardonNewComments();
    var allThreads = [];
    var selectedNontextblock = [];
    var selectedTexts = [];
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let current_url = urlParams.get("current_url");

    let isPostLock = wp.data.select("core/editor").isPostLocked();
    if (isPostLock && current_url) {
      setCookie("current_url", current_url, 5);
    }
    let shareUrl = getCookie("current_url");
    if (shareUrl) {
      current_url = shareUrl;
    }

    let selectedDataText;

    $(
      ".commentIcon, .wp-block mdspan,.cf-onwhole-block__comment"
    ).each(function () {
      selectedDataText = $(this).attr("datatext");
      selectedNontextblock.push(selectedDataText);
    });
    // If no comment tag exist, remove the loader and temp style tag immediately.
    var openBoards = jQuery(".cls-board-outer").length;
    const span_count = $(".wp-block mdspan").length;
    const nontext_count = selectedNontextblock.length;
    
    if (0 === span_count && 0 === nontext_count) {
      $(".commentOn .block-editor-writing-flow").css({ width: "100%" });
      //$('body').removeClass("commentOn");
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
      $("#cf-span__comments").removeClass("comments-loader");
      $("#loader_style").remove();
      //update autodraft meta data
      updateAutodraftIds("");
      if (current_url) {
        var noticeMsg = __(
          "The comment you are trying to access has been closed!",
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
        urlParams.delete("current_url");
        window.history.replaceState(
          {},
          "",
          `${location.pathname}?${urlParams}`
        );
      }
    } else {
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
      $("body").addClass("commentOn");
      selectedTexts = selectedNontextblock;
      selectedTexts = selectedTexts.filter(function (e) {
        return e;
      });
      selectedTexts.forEach((selectedText) => {
        if (
          "undefined" !== selectedText &&
          $("#" + selectedText).length === 0 &&
          selectedText.match(/^el/m) !== null
        ) {
          //remove unnecessary datatext value /@author:Pooja Bhimani/Since 3.4
          setTimeout(() => {
            removeDataText(selectedText);
          }, 500);

          var newNode = document.createElement("div");
          newNode.setAttribute("id", selectedText);
          newNode.setAttribute("class", "cls-board-outer cm-board is_active");

          var referenceNode = document.getElementById("cf-span__comments");
          referenceNode.appendChild(newNode);

          ReactDOM.render(
            <Board datatext={selectedText} onLoadFetch={1} />,
            document.getElementById(selectedText)
          );
          allThreads.push(selectedText);
        }
      });
      
      /**
       * Updates the list of thread IDs that have autodrafts enabled.
       * 
       * @param {Array} allThreads - Array containing all thread IDs on the page.
       */
      updateAutodraftIds(allThreads);
      const copyDatatext = allThreads.includes(current_url);
      if (current_url && false === copyDatatext) {
        var noticeMsg = __(
          "The comment you are trying to access has been closed!",
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

        urlParams.delete("current_url");
        window.history.replaceState(
          {},
          "",
          `${location.pathname}?${urlParams}`
        );
      } else {
        $(".js-activity-centre .user-data-row").removeClass("active");

        if (current_url) {
          let topOfText;
          const blockType = $('[datatext="' + current_url + '"]').attr(
            "data-type"
          );
          setTimeout(function () {
            if (current_url.match(/^el/m) !== null) {
              topOfText = $('[datatext="' + current_url + '"]').offset()?.top;
            }

            $("#cf-span__comments .cls-board-outer").css("opacity", "0.4");
            $("#cf-span__comments .cls-board-outer#" + current_url).addClass(
              "focus"
            );
            $("#cf-span__comments .cls-board-outer#" + current_url).css(
              "opacity",
              "1"
            );
            $("#cf-span__comments .cls-board-outer#" + current_url).offset({
              top: topOfText,
            });

            scrollBoardToPosition(topOfText);
          }, 1000);
          //User can comment on whole block/@author Pooja Bhimani/@since 2.0.4.6
          if (allowedBlocks.text.includes(blockType)) {
            $('[data-rich-text-format-boundary="true"]').removeAttr(
              "data-rich-text-format-boundary"
            );
            $('[datatext="' + current_url + '"]').attr(
              "data-rich-text-format-boundary",
              true
            );
          } else {
            $('[datatext="' + current_url + '"]').addClass("is-focused");
          }
          if ($(`#${current_url}`).hasClass("sg-board")) {
            let sid = $(`#${current_url}`).attr("data-sid");
            $(`#${sid}`).attr("data-rich-text-format-boundary", "true");
          }
          $(`#${current_url} .cf-share-comment`).focus();

          $(`#cf-${current_url}`).addClass("active");
          urlParams.delete("current_url");
          window.history.replaceState(
            {},
            "",
            `${location.pathname}?${urlParams}`
          );
        }
      }

      let loadAttempts = 0;
      const loadComments = setInterval(function () {
        //remove Visible
        var openBoards;

       if (
          "1" !== cf_permissions.hide_comment
        ) {
          openBoards = $(".cls-board-outer.cm-board").length;
        } else {
          openBoards = $(".cls-board-outer").length;
        }
        if (0 === openBoards) {
          jQuery.event.trigger({ type: "editorLayoutUpdate" });
          $("#cf-span__comments").removeClass("comments-loader");
        }
        loadAttempts++;
        if (1 <= $("#cf-span__comments .commentContainer").length) {
          clearInterval(loadComments);
          $("#loader_style").remove();
          $("#cf-span__comments").removeClass("comments-loader");
          //Remove Visible
          $("#history-toggle").attr("data-count", openBoards);
        }
        if (loadAttempts >= 10) {
          clearInterval(loadComments);
          $("#loader_style").remove();
          $("#cf-span__comments").removeClass("comments-loader");
        }
      }, 1000);
    }
  }

  //On setting Editor layout width
  var ediLayot = document.querySelector(".editor-styles-wrapper");
  var cmntLayout = document.querySelector("#cf-comments-suggestions__parent");
  var ediLayotWidth = ediLayot?.offsetWidth;
  var cmntLyotWidth = cmntLayout?.offsetWidth;
  var calcLyotWidth = ediLayotWidth - cmntLyotWidth;
  var editSidebarchck = wp.data
    .select("core/edit-post")
    .isEditorSidebarOpened();

  setTimeout(function () {
    if (editSidebarchck == true) {
      document.querySelector(".is-root-container").style.width =
        calcLyotWidth + "px";
    } else {
      document.querySelector(".is-root-container").style.width =
        calcLyotWidth + "px";
    }
  }, 100);
}

/**
 * Event handler for clicking on comment icons or other elements. 
 * Triggers when user clicks on comment icon, non-core block, 
 * comment block icons, alignment/text alignment icons, or lock icon.
*/
$(document).on(
  "click",
  ".commentIcon, .non-core-block, .cf-icon-wholeblock__comment, .cf-icon__addBlocks, .cf-icon__removeBlocks, [align_sg_id]:not(.commentIcon), [textAlign_sg_id]:not(.commentIcon), [lock_sg_id]:not(.commentIcon)",
  function (event) {

    // Add event.stopImmediatePropagation to resolve whole gallery block comment issue.
    event.stopImmediatePropagation();

    // Focus on block added and remove board @author: Mayank @since-3.4
    var block = wp.data.select("core/block-editor").getSelectedBlock();
    var focusElement = document.activeElement.localName;
    var selectedText;
    var selectedBlock;
    let alignSgId = "",
      textAlignSgId = "",
      lockSgId = "",
      isAlignClicked = false,
      isTextAlignClicked = false,
      isLockClicked = false; // For alignment block feature media blocks

    if (
      $(event.target).is(".cf-icon-wholeblock__comment") ||
      $(event.target).closest(".cf-icon-wholeblock__comment").length
    ) {
      event.stopPropagation(); // Prevent event bubbling
    }

    if (
      $(event.target).hasClass("cf-icon__addBlocks") ||
      $(event.target).hasClass("cf-icon__removeBlocks")
    ) {
      selectedBlock =
        $(event.target).attr("data-suggestion_id") ||
        $("#block-" + $(event.target).attr("data-blockclient_id")).attr(
          "suggestion_id"
        );
    } else {
      selectedText = event.currentTarget.getAttribute("datatext");
      selectedBlock = event.currentTarget.getAttribute("data-suggestion_id");

      if (!selectedText) {
        selectedText = $(event.currentTarget)
          .children(".commentIcon")
          .attr("datatext");
      }

      let floatText = [];
      floatText.push(selectedText);
      floatText.push(selectedBlock);
    }
    // For alignment block feature media blocks
    alignSgId = $(event.currentTarget).attr("align_sg_id") || "";
    textAlignSgId = $(event.currentTarget).attr("textAlign_sg_id") || "";
    lockSgId = $(event.currentTarget).attr("lock_sg_id") || "";

    if (
      selectedText &&
      $(event.currentTarget).hasClass("commentIcon") &&
      !alignSgId &&
      !textAlignSgId &&
      !lockSgId
    ) {
      alignSgId = $(event.currentTarget).parent().attr("align_sg_id") || "";
      textAlignSgId =
        $(event.currentTarget).parent().attr("textAlign_sg_id") || "";
      lockSgId = $(event.currentTarget).parent().attr("lock_sg_id") || "";
    }

    wp.data.dispatch("mdstore").setDataText(selectedText);
    if ("figcaption" === focusElement) {
      return;
    }

    if ("undefined" !== selectedText || "undefined" !== selectedBlock) {
      $(".cls-board-outer").removeClass("focus");
      $(".cls-board-outer").removeClass("is-open");
      $("#cf-span__comments .comment-delete-overlay").removeClass("show");
      $("#cf-span__comments .comment-resolve .resolve-cb").prop(
        "checked",
        false
      );
      $(".cls-board-outer .buttons-wrapper").removeClass("active");
      if ("undefined" !== selectedText) {
        $("#" + selectedText + ".cls-board-outer").addClass("focus");
      }
      if ("undefined" !== selectedBlock) {
        $("#" + selectedBlock + ".cls-board-outer").addClass("focus");
      }
      $(".cf-icon__addBlocks, .cf-icon__removeBlocks").removeClass("focus");
      $(".cf-icon-wholeblock__comment,.cf-onwhole-block__comment").removeClass(
        "focus"
      );
      $("#cf-span__comments .cls-board-outer").css("opacity", "0.4");
      $("#cf-span__comments .cls-board-outer.focus").css("opacity", "1");
      $("#cf-span__comments .cls-board-outer").css("top", 0);
      $("mdspan").removeAttr("data-rich-text-format-boundary");
      let realTimeMode = wp.data.select('core/editor').getEditedPostAttribute('meta')?._is_real_time_mode;
      if (true !== realTimeMode) {
        $('.btn-wrapper').css('display', 'none');
      }
      //Add code to support whole block comment/@author:Pooja/since 3.4
      if (
        $('[datatext="' + selectedText + '"]').hasClass(
          "cf-icon-wholeblock__comment"
        )
      ) {
        $(' [datatext="' + selectedText + '"]').addClass("focus");
      }

      const focusAlignBlockSg = (
        alignBlockId,
        suggetionType,
        wholeBlockSgId = "",
        wholeBlockCommentId = ""
      ) => {
        // Added a function to call in every case of lock, alignment feature @author - Mayank / since 3.6
        let topOfText = $(
          "[" + suggetionType + '="' + alignBlockId + '"]'
        )?.offset()?.top;
        let alignmentOuterHeight = 0;
        let singleBoardIdSuggestion = "sg" + alignBlockId;
        const attrAlignSgId =
          $("[" + suggetionType + '="' + alignBlockId + '"]').attr(
            "align_sg_id"
          ) || "";
        $("#" + singleBoardIdSuggestion).css("opacity", "1");
        $("#" + singleBoardIdSuggestion).addClass("focus onGoing");

        if (wholeBlockSgId && wholeBlockCommentId) {
          // If has block suggestion, comment and align suggestions.
          const SuggestionBoardOuterHeight =
            document.querySelector("#sg" + wholeBlockSgId).offsetHeight +
            document.querySelector("#" + wholeBlockCommentId).offsetHeight +
            20 || "";
          alignmentOuterHeight = 60;
          if (
            "lock_sg_id" === suggetionType &&
            $("[" + suggetionType + '="' + alignBlockId + '"]').attr(
              "align_sg_id"
            )
          ) {
            alignmentOuterHeight =
              document.querySelector("#sg" + alignBlockId).offsetHeight + 20 ||
              "";
          }
          $("#" + singleBoardIdSuggestion).offset({
            top:
              topOfText +
              SuggestionBoardOuterHeight +
              alignmentOuterHeight +
              20,
          });
        } else if (wholeBlockCommentId) {
          // If has Comment and align suggestions
          const SuggestionBoardOuterHeight =
            document.querySelector("#" + wholeBlockCommentId).offsetHeight ||
            "";
          if (
            "lock_sg_id" === suggetionType &&
            $("[" + suggetionType + '="' + alignBlockId + '"]').attr(
              "align_sg_id"
            )
          ) {
            alignmentOuterHeight =
              document.querySelector("#sg" + attrAlignSgId).offsetHeight + 20 ||
              "";
          }
          $("#" + singleBoardIdSuggestion).offset({
            top:
              topOfText +
              SuggestionBoardOuterHeight +
              alignmentOuterHeight +
              20,
          });
        }

        scrollBoardToPosition(topOfText);

        //Adding class to prevent multiple click on same selected Text
        $("#" + singleBoardIdSuggestion + ".cls-board-outer").addClass(
          "is-open"
        );

        $(".js-activity-centre .user-data-row").removeClass("active");
        if (wholeBlockCommentId) {
          $(`#cf-${wholeBlockCommentId}`).addClass("active");
        }
      };

      if (false === allowedBlocks.text.includes(block?.name)) {
        removeFloatingIcon();
      }

      var findMdSpan = ".cls-board-outer";
      $(findMdSpan).each(function () {
        var boardDatatext = $(this).attr("id");
        let singleBoardIdSuggestion;
        if (
          "undefined" !== selectedText &&
          boardDatatext.includes(selectedText)
        ) {
          let topOfText = $('[datatext="' + selectedText + '"]').offset()?.top;
          $("#" + selectedText).css("opacity", "1");
          $("#" + selectedText).addClass("focus onGoing");
          $("#" + selectedText).offset({ top: topOfText });

          scrollBoardToPosition(topOfText);

          //Adding class to prevent multiple click on same selected Text
          $("#" + selectedText + ".cls-board-outer").addClass("is-open");

          $(".js-activity-centre .user-data-row").removeClass("active");
          $(`#cf-${selectedText}`).addClass("active");
          wp.data.dispatch("mdstore").setIsActive(true);
        } else if (
          "undefined" !== selectedBlock &&
          boardDatatext.includes(selectedBlock)
        ) {
          // Focus on block added and remove board @author: Mayank @since-3.4
          let topOfText = $('[suggestion_id="' + selectedBlock + '"]')?.offset()
            ?.top;
          singleBoardIdSuggestion = "sg" + selectedBlock;
          $("#" + singleBoardIdSuggestion).css("opacity", "1");
          $("#" + singleBoardIdSuggestion).addClass("focus onGoing");
          $('[data-suggestion_id="' + selectedBlock + '"]').addClass("focus");
          if (
            $(event.target).hasClass("cf-icon-wholeblock__comment") &&
            $('[id="sg' + selectedBlock + '"]').length &&
            $('[id="' + selectedText + '"]').length
          ) {
            const SuggestionBoardOuterHeight =
              document.querySelector("#" + selectedText).offsetHeight || "";
            $("#" + singleBoardIdSuggestion).offset({
              top: topOfText + SuggestionBoardOuterHeight + 20,
            });
          } else {
            $("#" + singleBoardIdSuggestion).offset({ top: topOfText });
          }

          scrollBoardToPosition(topOfText);

          //Adding class to prevent multiple click on same selected Text
          $("#" + singleBoardIdSuggestion + ".cls-board-outer").addClass(
            "is-open"
          );

          $(".js-activity-centre .user-data-row").removeClass("active");
          $(`#cf-${selectedText}`).addClass("active");
        } else if (
          ($("#block-" + $(event.target).attr("data-blockclient_id")).attr(
            "align_sg_id"
          ) &&
            !isAlignClicked) ||
          (alignSgId && !isAlignClicked)
        ) {
          // For alignment block feature media blocks @author - Mayank / 3.6
          let alignBlockId =
            $("#block-" + $(event.target).attr("data-blockclient_id")).attr(
              "align_sg_id"
            ) || alignSgId;
          let suggetionType = "align_sg_id";
          focusAlignBlockSg(
            alignBlockId,
            suggetionType,
            selectedBlock,
            selectedText
          );
          isAlignClicked = true;
        } else if (
          ($("#block-" + $(event.target).attr("data-blockclient_id")).attr(
            "lock_sg_id"
          ) &&
            !isLockClicked) ||
          (lockSgId && !isLockClicked)
        ) {
          let alignBlockId =
            $("#block-" + $(event.target).attr("data-blockclient_id")).attr(
              "lock_sg_id"
            ) || lockSgId;
          let suggetionType = "lock_sg_id";
          focusAlignBlockSg(
            alignBlockId,
            suggetionType,
            selectedBlock,
            selectedText
          );
          isLockClicked = true;
        }
        if (!boardDatatext.includes(selectedText)) {
          removeBlankPopup(selectedText);
        }
      });

      jQuery.event.trigger({ type: "showHideComments" });
    }
  }
);

// Delete the popup and its highlight if user
// leaves the new popup without adding comment.
$(document).on("click keydown", ".is-selected", function (e) {

  // Prevent comment in reusable block inside text/html. @author: Nirav Soni.
  if (true === e.target?.parentNode?.parentNode?.classList?.contains('is-reusable') || true === e.target?.parentNode?.classList?.contains('is-reusable')) {
    $('.toolbar-button-with-text').parent().css('display', 'none');
    $('.toolbar-button-with-nontext').parent().css('display', 'block');
  }

  var block = wp.data.select("core/block-editor").getSelectedBlock();

  if (null != block) {

    var focusedElement = document.activeElement.localName;

    if (!multicollab_floating_icons.cf_hide_floating_icons) {
      var html = getSelectionHtml();
      if (
        (" " !== selectedText && undefined !== selectedText) ||
        (allowedBlocks.text.includes(block.name) && 0 === html.length)
      ) {
        removeFloatingIcon();
      } else {
        if ($(".cf-floating__wrapper").length < 1) {
          var $temp = $("<div id='floatingtext-wrap'></div>");
          $("body").append($temp);
          var wordpos = $temp.append(html);
          var position = wordpos.offset().top;
          if (
            true !==
            document.activeElement?.parentNode?.parentNode?.classList?.contains(
              "is-reusable"
            ) ||
            true !==
            document.activeElement?.parentNode?.classList?.contains(
              "is-reusable"
            )
          ) {
            const selectedBlock = wp.data
            .select("core/block-editor")
            .getSelectedBlock();
          var prefix = 'core/';
          if (
            (!selectedBlock ||
              !allowedBlocks.widget.includes(selectedBlock?.name)) &&
            selectedBlock?.name !== 'core/freeform' // To resolve github issue #1129
            && selectedBlock?.name.startsWith(prefix)
          ) {
            // Resolved #568 and #536 @author - Mayank / since 3.5
            createFloatingIcons(focusedElement);
          }
          }
        }
      }
    }

    if (
      !(
        allowedBlocks.text.includes(block.name) ||
        "figcaption" === focusedElement
      )
    ) {
      if (isKeyboardEvent.primaryAlt(e, "m")) {
        e.preventDefault();
        $(".toolbar-button-with-nontext").trigger("click");
      }
    }

    const latestBoard = $(".board.fresh-board")
      .parents(".cls-board-outer")
      .attr("id");
    var selectedText = $("#block-" + block.clientId).attr("datatext");
    // Add click event to generate comment through keyboard shortcut. Github: 456.
    if (e.event === "click" && selectedText !== latestBoard) {
      removeBlankPopup(selectedText);
      // remove highligh text on editor when blank comment added @author Nirav Soni since 4.0
      $("#cf-span__comments .cls-board-outer").removeClass("focus");
      $("#cf-span__comments .cls-board-outer").removeClass("is-open");
      $("#cf-span__comments .cls-board-outer").removeAttr("style");
    }

    if (
      "figure" === focusedElement ||
      "video" === focusedElement ||
      "img" === focusedElement
    ) {
      $(".toolbar-button-with-nontext").css("display", "block");
      $(".toolbar-button-with-text").css("display", "none");
    }
    if (
      !allowedBlocks.text.includes(block.name) &&
      "figcaption" !== focusedElement
    ) {
      if (
        1 === $(".board.fresh-board").length &&
        0 === $(".board.fresh-board .loading").length
      ) {
        removeBlankPopup(selectedText);
      }
      if (undefined === selectedText && $(this).hasClass("commentIcon")) {
        wp.data.dispatch("mdstore").setIsActive(false);
        $("#cf-span__comments .cls-board-outer").css("opacity", "1");
        $("#cf-span__comments .cls-board-outer").removeClass("focus");
        $("#cf-span__comments .cls-board-outer").removeClass("is-open");
        $("#cf-span__comments .cls-board-outer").removeAttr("style");
        $("#cf-span__comments .comment-delete-overlay").removeClass("show");
        $("#cf-span__comments .comment-resolve .resolve-cb").prop(
          "checked",
          false
        );
        $("#cf-span__comments .cls-board-outer .buttons-wrapper").removeClass(
          "active"
        );
      }
    }
  }
});

// When exit from FSE
$(document).on(
  "click",
  ".edit-post-visual-editor__exit-template-mode",
  function (e) {
    var iframe = jQuery(".wp-block-post-content iframe")
      .contents()
      .find(
        ".wp-block mdspan,.wp-block .mdadded,.wp-block .mdmodified,.wp-block .mdremoved,.commentIcon"
      );
    if (iframe.length === 0) {
      fetchComments();
      // on suggestion mode
      if (
        false === wp.data.select("core/edit-post").isEditingTemplate() &&
        true === wp.data.select("mdstore").getSuggestionMode()
      ) {
        wp.data
          .dispatch("core/editor")
          .editPost({ meta: { _sb_is_suggestion_mode: true } });
      }
    }
  }
);

function updateAutodraftIds(allThreads) {
  var data, removedItem;
  var threadsId = [];
  var autodraftIds = [];
  const CurrentPostID = wp.data.select("core/editor").getCurrentPostId(); // eslint-disable-line
  const url = `${activityLocalizer.apiUrl}/cf/v2/activities`;

  axios
    .get(url, {
      params: {
        postID: CurrentPostID,
      },
    })
    .then((res) => {
      data = res.data.threads;
      data.map((th) => {
        if (th.resolved === "false") {
          threadsId.push(th.elID);
        }
      });
      var newThreadsIdSet = new Set(allThreads);
      var setDifference = [...threadsId].filter((x) => !newThreadsIdSet.has(x));
      setDifference.map((ids) => {
        ids = ids.replace("sg", "");
        autodraftIds.push(["th_", ids].join(""));
      });

      var data = {
        action: "cf_update_meta",
        currentPostID: CurrentPostID,
        data: autodraftIds,
      };
      $.post(ajaxurl, data, function () {
        // eslint-disable-line
      });
    });
}
function removeBlankPopup(selectedText) {
  if (
    1 === $(".board.fresh-board").length &&
    0 === $(".board.fresh-board .loading").length
  ) {
    const latestBoard = $(".board.fresh-board")
      .parents(".cls-board-outer")
      .attr("id");
    if (selectedText !== latestBoard) {
      let blockType = $('[datatext="' + latestBoard + '"]').attr("data-type");
      let blockId = $('[datatext="' + latestBoard + '"]').attr("data-block");

      if (!allowedBlocks.text.includes(blockType) && undefined !== blockType) {
        $('[datatext="' + latestBoard + '"]').removeClass("commentIcon ");
        wp.data.dispatch("core/block-editor").updateBlock(blockId, {
          attributes: {
            datatext: "",
          },
        });
      } else {
        removeTag(latestBoard); // eslint-disable-line

        // To resolve whole comment blank popup issue. It will prevent a block from being removed.  @author: - Mayank / since 3.5
        if (
          $('[datatext="' + latestBoard + '"]').hasClass(
            "cf-onwhole-block__comment"
          )
        ) {
          const blockClientID =
            $('[datatext="' + latestBoard + '"]').attr("data-block") || "";
          if (blockClientID) {
            const attributes =
              wp.data
                .select("core/block-editor")
                .getBlockAttributes(blockClientID) || "";
            if (attributes?.className) {
              // Resolved block crash issue #403 @author - Mayank / since 3.5
              attributes.className = attributes?.className?.replace(
                /(cf-onwhole-block__comment)\s*/g,
                ""
              );
              wp.data
                .dispatch("core/block-editor")
                .updateBlockAttributes(blockClientID, {
                  className: attributes.className,
                  datatext: "",
                });
            } else {
              // Resolved block crash issue #403 @author - Mayank / since 3.5
              wp.data
                .dispatch("core/block-editor")
                .updateBlockAttributes(blockClientID, { datatext: "" });
            }
          }

          $('[datatext="' + latestBoard + '"].cf-onwhole-block__comment')
            .removeAttr("datatext")
            .removeClass("cf-onwhole-block__comment");
          $(
            '[datatext="' + latestBoard + '"].cf-icon-wholeblock__comment'
          ).remove();
        } else {
          $('[datatext="' + latestBoard + '"]').remove();
        }
      }

      $("#" + latestBoard).remove();
      //Remove :visible
      $("#history-toggle").attr("data-count", $(".cls-board-outer").length);
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
    }
  }
}

function removeDataText(selectedText) {
  var findMdSpan = ".cls-board-outer";
  var openBoards = $(".cls-board-outer").length;
  let blockType = $('[datatext="' + selectedText + '"]').attr("data-type");
  let blockId = $('[datatext="' + selectedText + '"]').attr("data-block");
  let boardDataArray = [];
  if (0 === openBoards && undefined === blockType) {
    removeTag(selectedText); // eslint-disable-line
  }
  $(findMdSpan).each(function () {
    var boardDatatext = $(this).attr("id");
    boardDataArray.push(boardDatatext);
  });
  if (!boardDataArray.includes(selectedText)) {
    if (undefined !== blockType) {
      $('[datatext="' + selectedText + '"]').removeClass(
        "cf-onwhole-block__comment "
      );
      $('[datatext="' + selectedText + '"]').removeClass(
        "cf-icon-wholeblock__comment "
      );
      // $('[datatext="' + selectedText + '"].cf-icon-wholeblock__comment').remove('span');
      $(
        '[datatext="' + selectedText + '"].cf-icon-wholeblock__comment'
      ).remove(); // Resolved #535 for whole comment block @author - Mayank / since 3.6
      wp.data.dispatch("core/block-editor").updateBlock(blockId, {
        attributes: {
          datatext: "",
        },
      });
    } else {
      removeTag(selectedText); // eslint-disable-line
      $('[datatext="' + selectedText + '"]').remove();
    }
  }
}

function FindReact(dom, traverseUp = 0) {
  const key = Object.keys(dom).find((key) =>
    key.startsWith("__reactInternalInstance$")
  );
  const domFiber = dom[key];
  if (domFiber == null) return null;
  // react <16
  if (domFiber._currentElement) {
    let compFiber = domFiber._currentElement._owner;
    for (let i = 0; i < traverseUp; i++) {
      compFiber = compFiber._currentElement._owner;
    }
    return compFiber._instance;
  }

  // react 16+
  const GetCompFiber = (fiber) => {
    //return fiber._debugOwner; // this also works, but is __DEV__ only
    let parentFiber = fiber.return;
    while (typeof parentFiber.type == "string") {
      parentFiber = parentFiber.return;
    }
    return parentFiber;
  };
  let compFiber = GetCompFiber(domFiber);
  for (let i = 0; i < traverseUp; i++) {
    compFiber = GetCompFiber(compFiber);
  }
  return compFiber.stateNode;
}

function createBoard(selectedText, value, onChange) {
  var referenceNode = document.getElementById("cf-span__comments");
  var newNode = document.createElement("div");
  newNode.setAttribute("id", selectedText);
  newNode.setAttribute("class", "cls-board-outer  cm-board is_active");

  referenceNode.appendChild(newNode);
  ReactDOM.render(
    <Board datatext={selectedText} lastVal={value} onChanged={onChange} />,
    document.getElementById(selectedText)
  );
}

function suggestionApply() {
  if (false === wp.data.select("mdstore").getSuggestionMode()) {
    wp.data.dispatch("core/editor").editPost({
      meta: { _sb_is_suggestion_mode: true },
    });
    wp.data.dispatch("mdstore").setSuggestionMode(true);
    var noticeMsg = sprintf(
      '%s <a href="https://docs.google.com/spreadsheets/d/1H0uksGbTMOy7f9fkSGXvkl1fwqO7ekShjo1j3JsOA6k/edit#gid=1835128986" target="_blank">%s</a>',
      __(
        "Suggestion mode is limited to a few blocks and actions only.",
        "content-collaboration-inline-commenting"
      ),
      __("Check compatibility.", "content-collaboration-inline-commenting")
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
    cf_removeAllNotices();
    wp.data.dispatch("core/notices").removeNotice("suggestionModeOff");
    wp.data.dispatch("core/notices").createNotice(
      "success", // Can be one of: success, info, warning, error.
      __("Suggestion Mode is ON", "content-collaboration-inline-commenting"), // Text string to display.
      {
        id: "suggestionModeOn",
        type: "snackbar",
        isDismissible: true, // Whether the user can dismiss the notice.
        // Any actions the user can perform.
      }
    );
    $(".cf-floating__button ul li:last-child").addClass("suggestion-active");
  } else {
    wp.data.dispatch("core/editor").editPost({
      meta: { _sb_is_suggestion_mode: false },
    });
    wp.data.dispatch("mdstore").setSuggestionMode(false);
    cf_removeAllNotices();
    wp.data.dispatch("core/notices").removeNotice("suggestionModeOn");
    wp.data.dispatch("core/notices").createNotice(
      "success", // Can be one of: success, info, warning, error.
      __("Suggestion Mode is OFF", "content-collaboration-inline-commenting"), // Text string to display.
      {
        id: "suggestionModeOff",
        type: "snackbar",
        isDismissible: true, // Whether the user can dismiss the notice.
        // Any actions the user can perform.
      }
    );
    $(".cf-floating__button ul li:last-child").removeClass("suggestion-active");
  }
}

// Register Custom Format Type: Comment.
const name = "multidots/comment";
const title = __("Comment", "content-collaboration-inline-commenting");
const mdComment = {
  name,
  title,
  tagName: "mdspan",
  className: "mdspan-comment",
  attributes: {
    datatext: "datatext",
  },
  edit: class toggleComments extends Component {
    constructor(props) {
      super(props);
      this.onToggle = this.onToggle.bind(this);
      this.onApply = this.onApply.bind(this);
      this.getSelectedText = this.getSelectedText.bind(this);
      this.floatComments = this.floatComments.bind(this);
      // Typecheck.
      toggleComments.propTypes = {
        value: PropTypes.object,
        activeAttributes: PropTypes.object,
        onChange: PropTypes.func,
        isActive: PropTypes.bool,
      };
    }
    onToggle() {
      const { value, onChange, activeAttributes, contentRef } = this.props;
      let { text, start, end } = value;
      let commentedOnText = text.substring(start, end);
      var block = wp.data.select("core/block-editor").getSelectedBlock();

      // Prevent comment in reusable block inside text/html
      if (true === contentRef.current?.parentNode?.parentNode?.classList?.contains('is-reusable') || true === contentRef.current?.parentNode?.classList?.contains('is-reusable')) {
        return;
      }

      // If text is not selected, show notice.
      if (
        start === end &&
        (allowedBlocks.media.includes(block.name) ||
          "figcaption" === contentRef?.current?.localName)
      ) {
        var noticeMsg = __(
          "Please select a block, text or media to comment on.",
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

        return;
      }

      //If comment box already open, show notice.
      var activeDataText = activeAttributes.datatext;
      var openBoardDataText = $(".is-open").attr("id");
      if (start !== end) {
        if (
          $(".cls-board-outer").hasClass("is-open") &&
          activeDataText === openBoardDataText &&
          undefined !== openBoardDataText
        ) {
          showNoticeMsg();
          return;
        }
      }

      var html = getSelectionHtml();
      var already_commented = jQuery(
        ".cf-floating__button ul li:first-child"
      ).attr("already_commented");
      if (null !== html.match(/td/g) && "core/table" === block.name) {
        var noticeMsg = __(
          "Comments are not posible on multiple cells.",
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

        return;
      }

      if (null !== html.match(/mdspan/g) || "true" === already_commented) {
        showNoticeMsg();
        return;
      }
      //commented on text for inline image
      var srcMatch = html.match(/\<img.+src\=(?:\"|\')(.+?)(?:\"|\')(?:.+?)\>/);
      if (null !== srcMatch) {
        var srcText = srcMatch[1].split("/");
        srcText = srcText[srcText.length - 1];
        commentedOnText = srcText;
      }
      var currentTime = Date.now();
      currentTime = "el" + currentTime;
      var newNode = document.createElement("div");
      newNode.setAttribute("id", currentTime);
      newNode.setAttribute("class", "cls-board-outer draftComment cm-board");
      var referenceNode = document.getElementById("cf-span__comments");
      if (null === referenceNode) {
        createCommentNode();
        var referenceNode = document.getElementById("cf-span__comments");
      }

      referenceNode?.appendChild(newNode);
      $("#history-toggle").attr(
        "data-count",
        $(".cls-board-outer:visible").length
      );
      //Activate Show All comment button in setting panel
      if (false === wp.data.select("mdstore").getShowComments()) {
        wp.data.dispatch("mdstore").setShowComments(true);
        $(".comment-toggle .components-form-toggle").removeClass("is-checked");
      }
      onChange(
        toggleFormat(value, { type: name }),
        ReactDOM.render(
          <Board
            datatext={currentTime}
            onChanged={onChange}
            lastVal={value}
            freshBoard={1}
            commentedOnText={commentedOnText}
          />,
          document.getElementById(currentTime)
        )
      );
      removeFloatingIcon();

      onChange(
        applyFormat(value, {
          type: name,
          attributes: { datatext: currentTime },
        })
      );
      // Toogle hide-comments class if the comments is hidden when try to add new one.
      if ($("body").hasClass("hide-comments")) {
        $("body").removeClass("hide-comments");
      }
      jQuery.event.trigger({ type: "editorLayoutUpdate" });
    }

    /**
     * Callback function that is invoked when the block is applied/inserted.
     * This handles any additional actions needed when the block is applied.
    */
    onApply() {
      var block = wp.data.select("core/block-editor").getSelectedBlock();
      var focusedElement = document.activeElement.localName;
      let isRichClassExist =
        document.activeElement.classList.contains("rich-text");
      if (
        allowedBlocks.text.includes(block.name) ||
        "figcaption" === focusedElement ||
        isRichClassExist
      ) {
        $(".toolbar-button-with-text").trigger("click");
      } else {
        $(".toolbar-button-with-nontext").trigger("click");
      }
    }

    /**
     * Gets the currently selected text in the editor.
     */
    getSelectedText() {
      const { onChange, value, activeAttributes, contentRef } = this.props;
      const activeFormats = value.activeFormats;

      // Prevent comment in reusable block inside text/html. @author: Nirav Soni.
      if (true === contentRef.current?.parentNode?.parentNode?.classList?.contains('is-reusable') || true === contentRef.current?.parentNode?.classList?.contains('is-reusable')) {
        setTimeout(function () {
          $('.toolbar-button-with-text').parent().css('display', 'none');
          $('.toolbar-button-with-nontext').parent().css('display', 'block');
        }, 50);
      }

      if (undefined === activeFormats || 0 === activeFormats.length) {
        return;
      }
      let selectedText;
      //if copy URL exist remove from existing URL
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const current_url = urlParams.get("current_url");
      let shareUrl = getCookie("current_url");

      if (current_url) {
        urlParams.delete("current_url");
        window.history.replaceState(
          {},
          "",
          `${location.pathname}?${urlParams}`
        );
      }
      if (shareUrl) {
        deleteCookie("current_url");
      }

      // Stripping out unwanted <mdspan> tags from the content.
      var findMdSpan = "mdspan";
      $(findMdSpan).each(function () {
        var datatext;
        datatext = $(this).attr("datatext");
        if (undefined === datatext) {
          $(this).replaceWith($(this).text());
        }
      });

      // Prevent on locked mode + fix for unnecessary calls on hover.
      if ($(".cls-board-outer").hasClass("locked")) {
        return;
      }

      // Add condition to solve @ mentioned remove issue while enter after @ sign. @Author: Rishi Shah
      // Ignore unnecessary event calls on hover.
      if (
        $("#" + activeAttributes.datatext + ".cls-board-outer").hasClass(
          "focus"
        ) &&
        true === $(".js-cf-share-comment").hasClass("comment-focus")
      ) {
        return;
      }

      // Reset Comments Float only if the selected text has no comments on it.
      // Comment this code to remove board from suggestion out text. @author: Rishi Shah.
      if (
        undefined === activeAttributes.datatext &&
        !$(".js-cf-share-comment").hasClass("comment-focus") &&
        !$("#cf-span__comments .cls-board-outer.sg-board.onGoing.focus")
          .length > 0
      ) {
        //check try to give comment on word ,who has a comment
        $("#cf-span__comments .cls-board-outer").css("opacity", "1");
        $("#cf-span__comments .cls-board-outer").removeClass("focus");
        $("#cf-span__comments .cls-board-outer").removeClass("is-open");
        $("#cf-span__comments .cls-board-outer").removeClass("is-selected");
        $("#cf-span__comments .comment-delete-overlay").removeClass("show");
        $("#cf-span__comments .comment-resolve .resolve-cb").prop(
          "checked",
          false
        );
        $("#cf-span__comments .cls-board-outer").removeAttr("style");
        $("#cf-span__comments .cls-board-outer .buttons-wrapper").removeClass(
          "active"
        );

        $("mdspan").removeAttr("data-rich-text-format-boundary");
        setTimeout(function () {
          if ($("#cf-span__comments").is(":empty")) {
            $("body").removeClass("commentOn");
          }
        }, 100);
      }

      var referenceNode = document.getElementById("cf-span__comments");
      // Remove tags if selected tag ID exist in 'remove-comment' attribute of body.
      let removedComments = $("body").attr("remove-comment");
      if (
        undefined !== activeAttributes.datatext &&
        undefined !== removedComments &&
        removedComments.indexOf(activeAttributes.datatext) !== -1
      ) {
        onChange(removeFormat(value, name));
      }

      if (undefined !== this.props.value.start && null !== referenceNode) {
        $(".cls-board-outer").removeClass("has_text");

        // Sync popups with highlighted texts.
        $(".wp-block mdspan").each(function () {
          selectedText = $(this).attr("datatext");

          // Bring back CTRL-Z'ed Text's popup.
          if (
            undefined !== selectedText &&
            $("#" + selectedText).length === 0
          ) {
            let removedComments = $("body").attr("remove-comment");
            if (
              undefined === removedComments ||
              (undefined !== removedComments &&
                removedComments.indexOf(selectedText) === -1)
            ) {
              createBoard(selectedText, value, onChange);
              removeFloatingIcon();
            } else {
              $('[datatext="' + selectedText + '"]').css(
                "background",
                "transparent"
              );
            }
          }
          //Remove Visible
          $("#history-toggle").attr("data-count", $(".cls-board-outer").length);
          if (true === wp.data.select("mdstore").getShowComments()) {
            $("#" + selectedText)
              .addClass("has_text")
              .show();
          }
        });

        selectedText = activeAttributes.datatext;
        // Delete the popup and its highlight if user
        // leaves the new popup without adding comment.
        if (selectedText) {
          removeBlankPopup(selectedText);
        }

        // Just hide these popups and only display on CTRLz
        $(
          "#cf-span__comments .cls-board-outer:not(.has_text):not([data-sid])"
        ).each(function () {
          //remove visible
          $("#history-toggle").attr("data-count", $(".cls-board-outer").length);
        });

        // Adding lastVal and onChanged props to make it deletable,
        // these props were not added on load.
        // It also helps to 'correct' the lastVal of CTRL-Z'ed Text's popup.
        if ($("#" + selectedText).length !== 0) {
          //if body hase hide comment class
          if ($("body").hasClass("hide-comments")) {
            jQuery.event.trigger({ type: "editorLayoutUpdate" });
          }
          ReactDOM.render(
            <Board
              datatext={selectedText}
              lastVal={value}
              onChanged={onChange}
            />,
            document.getElementById(selectedText)
          );
        }
        //check for suggestion and comment
        //change for comment over suggestion.
        let floatText = [];

        if (undefined !== activeFormats && activeFormats.length > 0) {
          {
            activeFormats.map((activeText) => {
              if (
                undefined !== activeText.attributes &&
                "core/link" !== activeText.type &&
                "core/underline" !== activeText.type
              ) {
                if (activeText.attributes.id) {
                  selectedText = activeText.attributes.id;
                  floatText.push(selectedText);
                } else {
                  if (activeText.attributes.datatext) {
                    selectedText = activeText.attributes.datatext;
                    floatText.push(selectedText);
                  }
                }
              }
            });
          }
        }

        // Float comments column.
        this.floatComments(floatText);
      }
      $(".js-activity-centre .user-data-row").removeClass("active");

      jQuery.event.trigger({ type: "showHideComments" });
    }


    /**
     * Floats comments based on the provided array of text selections.
     * 
     * @param {Array} selectedText - An array of text selections to float comments for.
     */
    floatComments(selectedText) {
      if (
        document.querySelectorAll(`[data-rich-text-format-boundary='${true}']`)
          .length !== 0 &&
        !$(".js-cf-share-comment").hasClass("comment-focus")
      ) {
        // Removing dark highlights from other texts,
        // only if current active text has an attribute,
        // and no 'focus' class active on mdspan tag.
        // This condition prevents thread popup flickering
        // when navigating through the activity center.

        // Adding focus on selected text's popup.
        var findMdSpan = ".mdspan-comment";
        var datatext;
        let topOfText;
        var newHeight;

        console.log("selectedText", selectedText);

        $(findMdSpan).each(function () {

          datatext = $(this).attr("datatext");
          if (selectedText.includes(datatext)) {
            $(".cls-board-outer").removeClass("focus");
            $(".cls-board-outer").removeClass("is-open");
            $(".cls-board-outer").removeClass("onGoing");
            $(".cf-icon__addBlocks, .cf-icon__removeBlocks").removeClass(
              "focus"
            );
            $(
              ".cf-icon-wholeblock__comment,.cf-onwhole-block__comment"
            ).removeClass("focus");

            $("#cf-span__comments .comment-resolve .resolve-cb").prop(
              "checked",
              false
            );
            $("#cf-span__comments .cls-board-outer").css("opacity", "0.4");

            let topOfTextSingleBoard;
            let singleBoardIdWithSg;
            var singleBoardId = selectedText[0];
            if (undefined !== singleBoardId) {
              topOfTextSingleBoard = $(
                '[datatext="' + singleBoardId + '"]'
              ).offset()?.top;
              singleBoardIdWithSg = singleBoardId;
            }

            $("#" + singleBoardIdWithSg).css("opacity", "1");
            $("#" + singleBoardIdWithSg + ".cls-board-outer").addClass(
              "is-open"
            );
            $("#" + singleBoardIdWithSg).addClass("focus onGoing");

            $("#" + singleBoardIdWithSg).offset({
              top: topOfTextSingleBoard,
            });
            
            scrollBoardToPosition(topOfTextSingleBoard);
            
            jQuery("#cf-span__comments .cls-board-outer.focus").css("opacity", "1");
          }
        });
      }
    }

    /**
     * This React component lifecycle method is called after the component is updated.
     * It is passed the previous props and can compare them to the current props to determine
     * if something significant to the component has changed. This method is often used to
     * re-run certain logic when a prop changes.
     */
    componentDidUpdate(prevProps) {
      // Typical usage (don't forget to compare props):
      if (
        this.props.activeAttributes.datatext !==
        prevProps.activeAttributes.datatext
      ) {
        wp.data.dispatch("mdstore").setDataText("");
      }
    }

    render() {
      const { isActive, value } = this.props;
      var date = new Date();
      let { text, start, end } = value;
      let isEditingTemplate = wp.data
        .select("core/edit-post")
        .isEditingTemplate();
      var block = wp.data.select("core/block-editor").getSelectedBlock();
      var focusedElement = document.activeElement.localName;
      let isRichClassExist =
        document.activeElement.classList.contains("rich-text");
      if (
        "figcaption" === focusedElement ||
        (isRichClassExist && start === end)
      ) {
        $(".toolbar-button-with-nontext")
          .parent()
          .css({ padding: "0", "border-right": "none" });
        $(".toolbar-button-with-nontext").css("display", "none");
      }
      return (
        <Fragment>
          {start === end &&
            !allowedBlocks.media.includes(block.name) &&
            undefined !== start &&
            undefined !== end &&
            "figcaption" !== focusedElement &&
            !isEditingTemplate && (
              <Fragment>
                <BlockControls>
                  <ToolbarGroup className="comment-group">
                    <ToolbarButton
                      icon="admin-comments"
                      isActive={wp.data.select("mdstore").getIsActive()}
                      label={__(
                        "Comment",
                        "content-collaboration-inline-commenting"
                      )}
                      onClick={NonTextComment.onToggleNonTextBlock}
                      shortcut={displayShortcut.primaryAlt("m")}
                      className={`comment-group-button toolbar-button-with-text toolbar-button__${name}`}
                    />
                  </ToolbarGroup>
                </BlockControls>
              </Fragment>
            )}

          {((allowedBlocks.text.includes(block.name) && start !== end) ||
            "figcaption" === focusedElement) &&
            !isEditingTemplate && (
              <Fragment>
                <RichTextShortcut
                  type="primaryAlt"
                  character="m"
                  onUse={this.onApply}
                />

                <BlockControls>
                  <ToolbarGroup className="comment-group">
                    <ToolbarButton
                      icon="admin-comments"
                      isActive={isActive}
                      label={__(
                        "Comment",
                        "content-collaboration-inline-commenting"
                      )}
                      onClick={this.onToggle}
                      shortcut={displayShortcut.primaryAlt("m")}
                      className={`comment-group-button toolbar-button-with-text toolbar-button__${name}`}
                    />
                  </ToolbarGroup>
                </BlockControls>
              </Fragment>
            )}
          {<Fragment>{this.getSelectedText()}</Fragment>}
        </Fragment>
      );
    }
  },
};
registerFormatType(name, mdComment);

addFilter("editor.BlockEdit", "mdComment/nontext-block", nonTextBlock);
