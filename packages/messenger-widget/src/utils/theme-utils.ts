export const defaultTheme: any = {
    backgroundContainer: '#1A1B22',
    normalBtnBorder: '2px solid #544393',
    configBoxBorder: '1px solid white',
    normalBtn: '#28204A',
    normalBtnHover: '#544393',
    normalBtnInactive: '#2A2B38',
    textPrimary: '#FFFF',
    textSecondary: '#81828D',
    backgroundActiveContact: 'linear-gradient(-259deg, #544393, #1f2029)',
    backgroundConfigBox: '#3A3C50',
    backgroundConfigBoxBorder: '1px solid #666876',
    chatBackground: '#1F2029',
    disabledBtnText: '#666876',
    textError: '#C30F1A',
    errorBackground: '#830B12',
    attachmentBackground: '#202129',
    profileConfigurationTextColor: '#666876',
    selectedContactBorderColor: '#544393',
    receivedMessageBackgroundColor: '#544393',
    receivedMessageTextColor: '#FFFF',
    sentMessageBackgroundColor: '#3A3C50',
    sentMessageTextColor: '#FFFF',
    infoBoxBackgroundColor: '#3A3C50',
    infoBoxTextColor: '#FFFF',
    buttonShadow: '#000000',
    msgCounterBackgroundColor: '#544393',
    msgCounterTextColor: '#FFFF',
    scrollbarBackgroundColor: '#2A2B38',
    scrollbarScrollerColor: '#3A3C50',
    inputFieldBackgroundColor: '#1F2029',
    inputFieldTextColor: '#FFFF',
    inputFieldBorderColor: '#81828D',
    emojiModalBackgroundColor: '21, 22, 23',
    emojiModalTextColor: '222, 222, 221',
    emojiModalAccentColor: '58, 130, 247',
    rainbowConnectBtnBackgroundColor: '#1a1b1f',
    rainbowConnectBtnTextColor: '#fff',
    rainbowAccentColor: '#3898ff',
    rainbowAccentForegroundColor: '#fff',
    rainbowModalTextColor: '#fff',
    rainbowModalTextSecondaryColor: 'rgba(255, 255, 255, 0.6)',
    rainbowModalBackgroundColor: '#1a1b1f',
    rainbowModalWalletHoverColor: 'rgba(224, 232, 255, 0.1)',
    alternateContactBackgroundColor: '#5443931A',
    menuBackgroundColor: '#2A2B38',
    preferencesHighlightedColor: '#8b7ff4',
    configureProfileModalBackgroundColor: '#D9D9D9',
};

export const getCustomizedTheme = (themeCss: any) => {
    return {
        backgroundContainer:
            themeCss.backgroundColor ?? defaultTheme.backgroundContainer,
        normalBtnBorder: themeCss.buttonBorderColor
            ? `2px solid ${themeCss.buttonBorderColor}`
            : defaultTheme.normalBtnBorder,
        configBoxBorder: themeCss.configBoxBorderColor
            ? `1px solid ${themeCss.configBoxBorderColor}`
            : defaultTheme.configBoxBorder,
        normalBtn: themeCss.buttonColor ?? defaultTheme.normalBtn,
        normalBtnHover:
            themeCss.hoverButtonColor ?? defaultTheme.normalBtnHover,
        normalBtnInactive:
            themeCss.inactiveButtonColor ?? defaultTheme.normalBtnInactive,
        textPrimary: themeCss.primaryTextColor ?? defaultTheme.textPrimary,
        textSecondary:
            themeCss.secondaryTextColor ?? defaultTheme.textSecondary,
        backgroundActiveContact:
            themeCss.activeContactBackgroundColor ??
            defaultTheme.backgroundActiveContact,
        backgroundConfigBox:
            themeCss.configurationBoxBackgroundColor ??
            defaultTheme.backgroundConfigBox,
        backgroundConfigBoxBorder: themeCss.configurationBoxBorderColor
            ? `1px solid ${themeCss.configurationBoxBorderColor}`
            : defaultTheme.backgroundConfigBoxBorder,
        chatBackground:
            themeCss.chatBackgroundColor ?? defaultTheme.chatBackground,
        disabledBtnText:
            themeCss.disabledButtonTextColor ?? defaultTheme.disabledBtnText,
        textError: themeCss.errorTextColor ?? defaultTheme.textError,
        errorBackground:
            themeCss.errorBackgroundColor ?? defaultTheme.errorBackground,
        attachmentBackground:
            themeCss.attachmentBackgroundColor ??
            defaultTheme.attachmentBackground,
        selectedContactBorderColor:
            themeCss.selectedContactBorderColor ??
            defaultTheme.selectedContactBorderColor,
        profileConfigurationTextColor:
            themeCss.profileConfigurationTextColor ??
            defaultTheme.profileConfigurationTextColor,
        receivedMessageBackgroundColor:
            themeCss.receivedMessageBackgroundColor ??
            defaultTheme.receivedMessageBackgroundColor,
        receivedMessageTextColor:
            themeCss.receivedMessageTextColor ??
            defaultTheme.receivedMessageTextColor,
        sentMessageBackgroundColor:
            themeCss.sentMessageBackgroundColor ??
            defaultTheme.sentMessageBackgroundColor,
        sentMessageTextColor:
            themeCss.sentMessageTextColor ?? defaultTheme.sentMessageTextColor,
        infoBoxBackgroundColor:
            themeCss.infoBoxBackgroundColor ??
            defaultTheme.infoBoxBackgroundColor,
        infoBoxTextColor:
            themeCss.infoBoxTextColor ?? defaultTheme.infoBoxTextColor,
        buttonShadow: themeCss.buttonShadow ?? defaultTheme.buttonShadow,
        msgCounterBackgroundColor:
            themeCss.msgCounterBackgroundColor ??
            defaultTheme.msgCounterBackgroundColor,
        msgCounterTextColor:
            themeCss.msgCounterTextColor ?? defaultTheme.msgCounterTextColor,
        scrollbarBackgroundColor:
            themeCss.scrollbarBackgroundColor ??
            defaultTheme.scrollbarBackgroundColor,
        scrollbarScrollerColor:
            themeCss.scrollbarScrollerColor ??
            defaultTheme.scrollbarScrollerColor,
        inputFieldBackgroundColor:
            themeCss.inputFieldBackgroundColor ??
            defaultTheme.inputFieldBackgroundColor,
        inputFieldTextColor:
            themeCss.inputFieldTextColor ?? defaultTheme.inputFieldTextColor,
        inputFieldBorderColor:
            themeCss.inputFieldBorderColor ??
            defaultTheme.inputFieldBorderColor,
        emojiModalBackgroundColor:
            themeCss.emojiModalBackgroundColor ??
            defaultTheme.emojiModalBackgroundColor,
        emojiModalTextColor:
            themeCss.emojiModalTextColor ?? defaultTheme.emojiModalTextColor,
        emojiModalAccentColor:
            themeCss.emojiModalAccentColor ??
            defaultTheme.emojiModalAccentColor,
        rainbowConnectBtnBackgroundColor:
            themeCss.rainbowConnectBtnBackgroundColor ??
            defaultTheme.rainbowConnectBtnBackgroundColor,
        rainbowConnectBtnTextColor:
            themeCss.rainbowConnectBtnTextColor ??
            defaultTheme.rainbowConnectBtnTextColor,
        rainbowAccentColor:
            themeCss.rainbowAccentColor ?? defaultTheme.rainbowAccentColor,
        rainbowAccentForegroundColor:
            themeCss.rainbowAccentForegroundColor ??
            defaultTheme.rainbowAccentForegroundColor,
        rainbowModalTextColor:
            themeCss.rainbowModalTextColor ??
            defaultTheme.rainbowModalTextColor,
        rainbowModalTextSecondaryColor:
            themeCss.rainbowModalTextSecondaryColor ??
            defaultTheme.rainbowModalTextSecondaryColor,
        rainbowModalBackgroundColor:
            themeCss.rainbowModalBackgroundColor ??
            defaultTheme.rainbowModalBackgroundColor,
        rainbowModalWalletHoverColor:
            themeCss.rainbowModalWalletHoverColor ??
            defaultTheme.rainbowModalWalletHoverColor,
        alternateContactBackgroundColor:
            themeCss.alternateContactBackgroundColor ??
            defaultTheme.alternateContactBackgroundColor,
        menuBackgroundColor:
            themeCss.menuBackgroundColor ?? defaultTheme.menuBackgroundColor,
        preferencesHighlightedColor:
            themeCss.preferencesHighlightedColor ??
            defaultTheme.preferencesHighlightedColor,
        configureProfileModalBackgroundColor:
            themeCss.configureProfileModalBackgroundColor ??
            defaultTheme.configureProfileModalBackgroundColor,
    };
};
