// To support images with extensions png, jpg, svg and gif
declare module '*.png';
declare module '*.gif';
declare module '*.jpg';

declare module '*.svg' {
    const content: string;
    export default content;
}

declare module 'localforage' {
    let localforage: LocalForage;
    export = localforage;
}

// Current version of Wagmi needs this declaration as per the document
declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}
