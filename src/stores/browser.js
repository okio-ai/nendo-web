import { defineStore } from 'pinia'

export const useBrowserStore = defineStore({
    id: 'browser',
    state: () => ({
        searchQuery: '',
        searchFilterActive: false,
        searchExploreActive: false,
        searching: false,
        sidebarActive: true,
        toolViewActive: false,
        toolViewActiveTool: '',
        collectionModal: false,
        collectionModalAdd: false,
        collectionModalEdit: false,
        mainNavActive: 'library',
        audioPlayerSeek: 0,
        audioEngine: null,
        isMobile: false,
        export: {
            modal: false,
            track: null,
            tracks: null,
            collection: null,
            filename: null
        },
        intro: {
            modal: false
        },
        loading: false,
        error: null
    }),
    getters: {},
    actions: {}
})
