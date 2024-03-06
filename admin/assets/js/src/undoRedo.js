export function undoRedoFun(_this, differenceAttr) {

  // Call the functional component from within a method
  document.addEventListener('keydown', function (event) {

    var blockName = wp.data.select('core/block-editor').getSelectedBlock();

    //Fucntionality for redo the last changes.
    if (wp.keycodes.isKeyboardEvent.primary(event, 'y')) {
      
      // Stop event call twice.
      event.stopImmediatePropagation();

      // Redo functionality with mdstore state.
      
      var getredoData = wp.data.select('mdstore').getredoData();
      var getredoDataLastElement = getredoData.pop();

      if( getredoDataLastElement ) {
        var SgElement = document.getElementById( getredoDataLastElement.id );
        var lastUndoHistory = getredoDataLastElement.id;
        
        if (SgElement && SgElement.classList.contains('cls-board-outer')) { 
          setTimeout(() => {

            jQuery('#' + lastUndoHistory).show();
            var updatedBlockHtml = getredoDataLastElement.content;
            var clientIdBlock = document.querySelector("#block-" + getredoDataLastElement.clientId);
            if( clientIdBlock?.classList.contains( 'cf-onwhole-block__comment' ) ) {
              clientIdBlock.innerHTML = getredoDataLastElement.content;
              clientIdBlock.classList.add("cf-onwhole-block__comment");
              var wholeBlockComment = document.querySelector(".cf-icon-wholeblock__comment[datatext="+getredoDataLastElement.id+"]");
              wholeBlockComment.style.display = "block";
            }

            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = updatedBlockHtml; // phpcs:ignore
            let finalContentSg = tempDiv.innerHTML;
            // While updating content prevent creating a new suggestions. 
            var shEnableFlag = false;
            if(true === wp.data.select("core/editor").getEditedPostAttribute("meta")?._sb_is_suggestion_mode ) {
              shEnableFlag = true;
              wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: false } });
            }
            wp.data.dispatch('core/editor').updateBlockAttributes(getredoDataLastElement.clientId, {
              content: finalContentSg
            });

            if(true === shEnableFlag ) {
              wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: true } });
            }

            jQuery(`#${lastUndoHistory}`).attr('data-rich-text-format-boundary', true);
            jQuery(`#${lastUndoHistory}`).addClass('cls-board-outer sg-board is-open focus onGoing');

            setTimeout(() => {
              floatCommentsBoard(lastUndoHistory);
            }, 300);
            

          }, 300);

        } else {

          setTimeout(() => {
            wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: false } });

            jQuery("[data-sid='" + lastUndoHistory + "']").show();

            var updatedBlockHtml = getredoDataLastElement.content;

            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = updatedBlockHtml; // phpcs:ignore
            let finalContentSg = tempDiv.innerHTML;
            // While updating content prevent creating a new suggestions. 
            wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: false } });
            // wp.data.dispatch('core/editor').updateBlockAttributes(getredoDataLastElement.clientId, {
            //   differenceAttr: finalContentSg
            // });
            wp.data.dispatch('core/block-editor').updateBlockAttributes(getredoDataLastElement.clientId, {
              [differenceAttr]: finalContentSg
            });

            //updateSgHistory( lastUndoHistory, getredoDataLastElement.data, _this );

            var sbSgHistory = wp.data.select('core/editor').getEditedPostAttribute('meta')?._sb_suggestion_history;
            var sbSgHistoryJson = JSON.parse( sbSgHistory );
            var testArray = [];

            if( sbSgHistoryJson[lastUndoHistory] ){
              updateSgHistory( lastUndoHistory, getredoDataLastElement.data, _this );
            } else {
              testArray.push(getredoDataLastElement.data);
              sbSgHistoryJson[lastUndoHistory] = testArray;
              // update post suggestions meta value
              wp.data.dispatch('core/editor').editPost({
                meta: { _sb_suggestion_history: JSON.stringify(sbSgHistoryJson) },
              });

            }

            setTimeout(() => {
              wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: true } });  
            }, 300);
            
            setTimeout(() => {
              jQuery(`#sg${lastUndoHistory}`).attr('data-rich-text-format-boundary', true);
              jQuery(`#sg${lastUndoHistory}`).addClass('cls-board-outer sg-board is-open focus onGoing');
              jQuery(`#sg${lastUndoHistory}`).removeClass('undo-suggestion');
  
              floatCommentsBoard(lastUndoHistory);
            }, 300);

          }, 500);

        }

        // Set value in redo state.
        var getundoData = wp.data.select('mdstore').getundoData();
        var tempArray = [];

        if( null !== getundoData ) {
          getundoData.push(getredoDataLastElement);
          tempArray = getundoData;
        } else {
          tempArray.push(getredoDataLastElement);
        }
        wp.data.dispatch('mdstore').setundoData(tempArray);

      }

      // End Redo functionality with mdstore state.
    }

  if (wp.keycodes.isKeyboardEvent.primary(event, 'z')) {

      // Stop event call twice.
      event.stopImmediatePropagation();

      // Undo functionality with mdstore state.
      var getUndoData = wp.data.select('mdstore').getundoData();
      var getUndoDataLastElement = getUndoData.pop();

      if( getUndoDataLastElement ) {
        var SgElement = document.getElementById( getUndoDataLastElement.id );

        if (SgElement && SgElement.classList.contains('cls-board-outer')) {
          // Comment Board.
          let clientId = jQuery("[datatext='" + getUndoDataLastElement.id + "']").closest('.block-editor-block-list__block').attr( 'data-block' );
          var BeforeBlockHtml = jQuery( '#block-' + clientId ).html();
          getUndoDataLastElement.content = BeforeBlockHtml;
          getUndoDataLastElement.clientId = clientId;
          setTimeout(() => {
            // While updating content prevent creating a new suggestions. 

            var shEnableFlag = false;
            if(true === wp.data.select("core/editor").getEditedPostAttribute("meta")?._sb_is_suggestion_mode ) {
              shEnableFlag = true;
              wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: false } });
            }
            
            const attributes = wp.data.select('core/block-editor').getBlockAttributes(clientId);
            var getUndoDataLastElementData = document.querySelector("[datatext='"+getUndoDataLastElement.id+"']");
            var clientIdBlock = document.querySelector("#block-" + clientId);
            if( clientIdBlock?.classList.contains( 'cf-onwhole-block__comment' ) ) {
              attributes.className = attributes?.className?.replace(/(cf-onwhole-block__comment)\s*/g, '');
              clientIdBlock.classList.remove("cf-onwhole-block__comment");
              clientIdBlock.innerHTML = getUndoDataLastElement.content;
              var wholeBlockComment = document.querySelector(".cf-icon-wholeblock__comment[datatext="+getUndoDataLastElement.id+"]");
              wholeBlockComment.style.display = "none";
            } else {
              getUndoDataLastElementData.replaceWith(getUndoDataLastElement.data.commentedOnText);
            }
            
            jQuery('#' + getUndoDataLastElement.id).hide();

            var updatedBlockHtml = jQuery( '#block-' + clientId ).html();
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = updatedBlockHtml; // phpcs:ignore
            let finalContentSg = tempDiv.innerHTML;

            wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
              content: finalContentSg,
              className: attributes.className,
            });

            if( true === shEnableFlag ) {
              setTimeout(() => {
                wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: true } });
              }, 500);
            }
            

          }, 300);

        } else {
          // If multiple suggestion is applied.
          let clientId = jQuery(`#${getUndoDataLastElement.id}`).closest('.block-editor-block-list__block').attr( 'data-block' );
          var BeforeBlockHtml = jQuery( '#block-' + clientId ).html();
          getUndoDataLastElement.content = BeforeBlockHtml;
          getUndoDataLastElement.clientId = clientId;

            // Single suggestion.
            setTimeout(() => {
              var sbSgHistory = wp.data.select('core/editor').getEditedPostAttribute('meta')?._sb_suggestion_history;
              var sbSgHistoryJson = JSON.parse( sbSgHistory );

              delete sbSgHistoryJson[getUndoDataLastElement.id];

              // update post suggestions meta value
              wp.data.dispatch('core/editor').editPost({
                meta: { _sb_suggestion_history: JSON.stringify(sbSgHistoryJson) },
              });

              wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: false } });
              
              // Added delete text condition to fix github issue: 888
              var suggestionElement = this.getElementById( getUndoDataLastElement.id );
              
              // Added Add condition to solve Github issue: 963
              if( suggestionElement ){
                if( 'Delete' === getUndoDataLastElement.data.action ) {
                  suggestionElement.outerHTML = SgElement?.textContent;
                } else {
                  suggestionElement.outerHTML = getUndoDataLastElement.data.oldvalue ? getUndoDataLastElement.data.oldvalue : '';
                }
                
                jQuery("[data-sid='" + getUndoDataLastElement.id + "']").hide();
  
                var updatedBlockHtml = jQuery( '#block-' + clientId ).html();
  
                let tempDiv = document.createElement('div');
                tempDiv.innerHTML = updatedBlockHtml; // phpcs:ignore
                let finalContentSg = tempDiv.innerHTML;
                // While updating content prevent creating a new suggestions. 
  
                //wp.data.dispatch('core/block-editor').updateBlock(clientId, { attributes: { [differenceAttr]: finalContentSg } });
                wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
                  [differenceAttr]: finalContentSg
                });

                // Add class to solve Github issue: 908
                jQuery(`#sg${getUndoDataLastElement.id}`).addClass('undo-suggestion');
              }

              setTimeout(() => {
                wp.data.dispatch('core/editor').editPost({ meta: { _sb_is_suggestion_mode: true } });
              }, 500);
              
            }, 300);

        }

        // Set value in redo state.
        var getredoData = wp.data.select('mdstore').getredoData();
        var tempArray = [];

        if( null !== getredoData ) {
          getredoData.push(getUndoDataLastElement);
          tempArray = getredoData;
        } else {
          tempArray.push(getUndoDataLastElement);
        }
        wp.data.dispatch('mdstore').setredoData(tempArray);
      }

      // End Undo functionality with mdstore state.
    }
  });

}

/**
 * Updates the suggestion history state with a new entry.
 * 
 * @param {string} uniqueId - The unique ID of the suggestion.
 * @param {Object} tempObject - The suggestion data object to store.
 * @param {Object} _this - The suggestion element context.
 */
function updateSgHistory(uniqueId, tempObject, _this) {

  // Update suggestion history.
  setTimeout(() => {

    var sbSgHistory = wp.data.select('core/editor').getEditedPostAttribute('meta')?._sb_suggestion_history;
    var suggestionHistory = JSON.parse( sbSgHistory );

    if (undefined === suggestionHistory) {
      suggestionHistory = {};
      suggestionHistory[uniqueId] = tempObject;
    } else if (!suggestionHistory[uniqueId]) {
      suggestionHistory[uniqueId] = tempObject;
    } else {
      Object.assign(suggestionHistory[uniqueId][0], tempObject);
    }

    // update post suggestions meta value
    wp.data.dispatch('core/editor').editPost({
      meta: { _sb_suggestion_history: JSON.stringify(suggestionHistory) },
    });
           
  }, 300);

}
