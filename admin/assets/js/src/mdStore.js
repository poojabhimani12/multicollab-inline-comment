
const initialState = {
    showComments: true,
    setActive : false,
    suggestionMode : false,
};

const actions = {
    setShowComments(showComments = true) {
        return {
            type: "showComments",
            payload : showComments
        };
    },

    setDataText(datatext = '') {
        return {
            type: "DataText",
            payload : datatext
        };
    },
    setAllCommentCount(allcommentcount = '') {
        return {
            type: "AllcommentsCount",
            payload : allcommentcount
        };
    },
    setIsActive(setActive = false) {
        return {
            type: "setActive",
            payload : setActive
        };
    },
    setSuggestionMode(suggestionMode = false) {
        return {
            type: "suggestionMode",
            payload : suggestionMode
        };
    },
    setRealTimeMode(realTimeMode = false) {
        return {
            type: "realTimeMode",
            payload : realTimeMode
        };
    },
    setUserCapability(userCapability = null) { // To set user's capability guest functionality @author - Mayank / since 3.6
        return {
            type: "userCapability",
            payload : userCapability
        };
    },
    setundoData( undoData = null ) {
        return {
            type: "undoData",
            payload : undoData
        };
    },
    setredoData( redoData = null ) {
        return {
            type: "redoData",
            payload : redoData
        };
    },
};

const mdStore = {
    reducer(state = initialState , action){
        if(action.type === 'showComments'){
            return{ ...state, showComments: action.payload }
        }
        if(action.type === 'DataText'){
            return{ ...state, datatext: action.payload }
        }
        if(action.type === 'AllcommentsCount'){
            return{ ...state, allcommentcount: action.payload }
        }
        if(action.type === 'setActive'){
            return{ ...state, setActive: action.payload }
        }
        if(action.type === 'suggestionMode'){
            return{ ...state, suggestionMode: action.payload }
        }
        if(action.type === 'realTimeMode'){
            return{ ...state, realTimeMode: action.payload }
        }
        if(action.type === 'userCapability'){ // To set user's capability guest functionality @author - Mayank / since 3.6
            return{ ...state, userCapability: action.payload }
        }
        if(action.type === 'undoData'){ // To set undoData state @author - Rishi Shah
            return{ ...state, undoData: action.payload }
        }
        if(action.type === 'redoData'){ // To set redoData state @author - Rishi Shah
            return{ ...state, redoData: action.payload }
        }
        return state;
    },

selectors: {
    getShowComments( state ) {
      
        return state.showComments;
    },

    getDataText(state){
        return state.datatext ? state.datatext : null; 
    },
    getAllCommentCount(state){
        return state.allcommentcount ? state.allcommentcount : null; 
    },
    getIsActive(state){
        return state.setActive;
    },
    getSuggestionMode(state){
        return state.suggestionMode;
    },
    getRealTimeMode(state){
        return state.realTimeMode;
    },
    getUserCapability(state){ // To get user's capability guest functionality @author - Mayank / since 3.6
        return state.userCapability ? state.userCapability : null;
    },
    getundoData(state){
        return state.undoData ? state.undoData : null;
    },
    getredoData(state){
        return state.redoData ? state.redoData : null;
    },
   
},
actions: actions,
};
if(undefined === wp.data.select('mdstore')){
    wp.data.registerStore('mdstore',mdStore);
}

wp.data.subscribe(() =>{
    const showcomment = wp.data.select('mdstore').getShowComments();
    const showDatatext = wp.data.select('mdstore').getDataText();
    const showcommentCounts = wp.data.select('mdstore').getAllCommentCount();
    const setIsActive = wp.data.select('mdstore').getIsActive();
    const suggestionMode = wp.data.select('mdstore').getSuggestionMode();
    const realTimeMode = wp.data.select('mdstore').getRealTimeMode();
    const userCapability = wp.data.select('mdstore').getUserCapability(); // To get user's capability guest functionality @author - Mayank / since 3.6
    const undoData = wp.data.select('mdstore').getundoData();
    const redoData = wp.data.select('mdstore').getredoData();
});
