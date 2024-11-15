import './Message.css';
import { getMessageChangeText } from './bl';
import blueTickIcon from '../../assets/images/tick.svg';
import whiteTickIcon from '../../assets/images/white-tick.svg';
import { MessageProps } from '../../interfaces/props';
import { MessageIndicator } from '../../hooks/messages/useMessage';
import { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import { MsgViewType } from '../../hooks/settings/useSettings';

export function MessageDetail(props: MessageProps) {
    const { msgViewSelected } = useContext(SettingsContext);

    const getMessageIndicatorView = (
        indicator: MessageIndicator | undefined,
    ) => {
        if (!indicator || indicator === MessageIndicator.SENT) {
            return (
                <img
                    className="indicator-tick-icon"
                    src={whiteTickIcon}
                    alt="read"
                />
            );
        }

        const indicatorIcon =
            indicator === MessageIndicator.RECEIVED
                ? whiteTickIcon
                : blueTickIcon;

        return (
            <>
                <img
                    className="indicator-tick-icon"
                    src={indicatorIcon}
                    alt="read"
                />
                <img
                    src={indicatorIcon}
                    alt="read"
                    className="second-tick indicator-tick-icon"
                />
            </>
        );
    };

    return (
        <div className="d-flex justify-content-end pt-1 ps-1 pe-1">
            {getMessageChangeText(props)}
            {new Date(Number(props.time)).toLocaleString()}

            {/* readed message tick indicator */}
            <span className="tick-icon readed-tick-icon">
                {props.ownMessage ? (
                    getMessageIndicatorView(props.indicator)
                ) : msgViewSelected.viewType === MsgViewType.OLD ? (
                    <></>
                ) : (
                    getMessageIndicatorView(MessageIndicator.READED)
                )}
            </span>
        </div>
    );
}
