import './SignInHelp.css';

interface SignInHelpProps {
    existingAccount: boolean;
}

function SignInHelp(props: SignInHelpProps) {
    return (
        <div className="row d-flex justify-content-center row-space text-start">
            <div className="d-flex justify-content-start">
                <div className="arrow-left h-100" />
                <div className="circle-char text-center">1</div>
                <div>Connect an Ethereum account</div>
            </div>
            {props.existingAccount && (
                <div className="sign-in-help-1 d-flex justify-content-start">
                    <div className="arrow-left h-100" />
                    <div className="circle-char text-center">2</div>
                    <div>Load persisted data</div>
                </div>
            )}

            <div className="sign-in-help-1 d-flex justify-content-start">
                <div className="arrow-left h-100" />
                <div className="circle-char text-center">
                    {props.existingAccount ? '3' : '2'}
                </div>
                <div>Sign in to proof your account ownership</div>
            </div>
        </div>
    );
}

export default SignInHelp;
