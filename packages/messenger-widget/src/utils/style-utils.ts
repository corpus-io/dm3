import { getCustomizedTheme, defaultTheme } from './theme-utils';

// Method to set styles in classes
export const setTheme = (theme: string | undefined | null) => {
    const themeDetails: any = selectTheme(theme);
    document.body.appendChild(
        Object.assign(document.createElement('style'), {
            textContent: `:root {
            --background-container: ${themeDetails.backgroundContainer};
            --normal-btn-border: ${themeDetails.normalBtnBorder};
            --config-box-border: ${themeDetails.configBoxBorder};
            --normal-btn: ${themeDetails.normalBtn};
            --normal-btn-hover: ${themeDetails.normalBtnHover};
            --normal-btn-inactive: ${themeDetails.normalBtnInactive};
            --text-primary-color: ${themeDetails.textPrimary};
            --text-secondary-color: ${themeDetails.textSecondary};
            --background-active-contact: ${themeDetails.backgroundActiveContact};
            --background-config-box: ${themeDetails.backgroundConfigBox};
            --background-config-box-border: ${themeDetails.backgroundConfigBoxBorder};
            --background-chat: ${themeDetails.chatBackground};
            --disabled-btn-text: ${themeDetails.disabledBtnText};
            --error-text: ${themeDetails.textError};
            --error-background: ${themeDetails.errorBackground};
            --attachment-background: ${themeDetails.attachmentBackground};
            --selected-contact-border-color: ${themeDetails.selectedContactBorderColor};
            --profile-configuration-text-color: ${themeDetails.profileConfigurationTextColor};
            --received-message-background-color: ${themeDetails.receivedMessageBackgroundColor};
            --received-message-text-color: ${themeDetails.receivedMessageTextColor};
            --sent-message-background-color: ${themeDetails.sentMessageBackgroundColor};
            --sent-message-text-color: ${themeDetails.sentMessageTextColor};
            --info-box-background-color: ${themeDetails.infoBoxBackgroundColor};
            --info-box-text-color: ${themeDetails.infoBoxTextColor};
            --button-shadow: ${themeDetails.buttonShadow};
            --msg-counter-background-color: ${themeDetails.msgCounterBackgroundColor};
            --msg-counter-text-color: ${themeDetails.msgCounterTextColor};
            --scrollbar-background-color: ${themeDetails.scrollbarBackgroundColor};
            --scrollbar-scroller-color: ${themeDetails.scrollbarScrollerColor};
            --input-field-background-color: ${themeDetails.inputFieldBackgroundColor};
            --input-field-text-color: ${themeDetails.inputFieldTextColor};
            --input-field-border-color: ${themeDetails.inputFieldBorderColor};
            --emoji-modal-background-color: ${themeDetails.emojiModalBackgroundColor};
            --emoji-modal-text-color: ${themeDetails.emojiModalTextColor};
            --emoji-modal-accent-color: ${themeDetails.emojiModalAccentColor};
            --rainbow-connect-btn-background-color: ${themeDetails.rainbowConnectBtnBackgroundColor};
            --rainbow-connect-btn-text-color: ${themeDetails.rainbowConnectBtnTextColor};
            --rainbow-accent-color: ${themeDetails.rainbowAccentColor};
            --rainbow-accent-foreground-color: ${themeDetails.rainbowAccentForegroundColor};
            --rainbow-modal-text-color: ${themeDetails.rainbowModalTextColor};
            --rainbow-modal-text-secondary-color: ${themeDetails.rainbowModalTextSecondaryColor};
            --rainbow-modal-background-color: ${themeDetails.rainbowModalBackgroundColor};
            --rainbow-modal-wallet-hover-color: ${themeDetails.rainbowModalWalletHoverColor};
            --alternate-contact-background-color: ${themeDetails.alternateContactBackgroundColor};
            --menu-background-color: ${themeDetails.menuBackgroundColor};
            --preferences-highlighted-color: ${themeDetails.preferencesHighlightedColor};
            --configure-profile-modal-background-color: ${themeDetails.configureProfileModalBackgroundColor};
        }`,
        }),
    );
};

// Method to get all css style class based on theme selected
export const selectTheme = (theme: any | undefined | null): object => {
    if (!theme) {
        return defaultTheme;
    } else {
        return getCustomizedTheme(theme);
    }
};

// Updates the button style
export function changeButtonStyle(
    event: React.MouseEvent,
    classOne: string,
    classTwo: string,
) {
    event.currentTarget.classList.remove(classOne);
    event.currentTarget.classList.add(classTwo);
}
