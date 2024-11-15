import { useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ConversationContextProvider } from '../../context/ConversationContext';
import { DM3ConfigurationContext } from '../../context/DM3ConfigurationContext';
import { MessageContextProvider } from '../../context/MessageContext';
import { ModalContext } from '../../context/ModalContext';
import { Dm3Props } from '../../interfaces/config';
import { SiweValidityStatus } from '../../utils/enum-type-utils';
import Dashboard from '../../views/Dashboard/Dashboard';
import { Loader, startLoader } from '../Loader/Loader';
import { SignIn } from '../SignIn/SignIn';
import { Siwe } from '../Siwe/Siwe';
import { NotificationContextProvider } from '../../context/NotificationContext';
import { DM3UserProfileContextProvider } from '../../context/DM3UserProfileContext';

function DM3(props: Dm3Props) {
    const {
        setDm3Configuration,
        setScreenWidth,
        setSiweValidityStatus,
        validateSiweCredentials,
    } = useContext(DM3ConfigurationContext);

    const { setLoaderContent } = useContext(ModalContext);

    const { isProfileReady } = useContext(AuthContext);

    // updates rainbow kit provider height to 100% when rendered
    useEffect(() => {
        const childElement = document.getElementById('data-rk-child');
        if (childElement && childElement.parentElement) {
            childElement.parentElement.classList.add('h-100');
        }

        // sets the DM3 confguration provided from props
        setDm3Configuration(props.config);
    }, [props]);

    // This handles the responsive check of widget
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // validate SIWE credentials
    useEffect(() => {
        const validateSiwe = async () => {
            if (props.config.siwe) {
                setLoaderContent('Validating SIWE credentials');
                startLoader();
                setSiweValidityStatus(SiweValidityStatus.IN_PROGRESS);
                await validateSiweCredentials(props.config.siwe);
            }
        };
        validateSiwe();
    }, []);

    return (
        <div id="data-rk-child" className="h-100">
            <DM3UserProfileContextProvider>
                <ConversationContextProvider config={props.config}>
                    <MessageContextProvider>
                        <Loader />
                        {!isProfileReady ? (
                            props.config.siwe ? (
                                <Siwe
                                    backgroundImage={props.config.signInImage}
                                />
                            ) : (
                                <SignIn />
                            )
                        ) : (
                            <NotificationContextProvider>
                                <div className="h-100 background-container">
                                    <Dashboard />
                                </div>
                            </NotificationContextProvider>
                        )}
                    </MessageContextProvider>
                </ConversationContextProvider>
            </DM3UserProfileContextProvider>
        </div>
    );
}

export default DM3;
