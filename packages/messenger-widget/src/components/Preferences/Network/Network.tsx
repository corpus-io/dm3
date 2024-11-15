import './Network.css';
import { Heading } from '../Heading/Heading';
import deleteIcon from '../../../assets/images/delete.svg';
import { useContext, useEffect } from 'react';
import { DM3UserProfileContext } from '../../../context/DM3UserProfileContext';
import { ModalContext } from '../../../context/ModalContext';
import { PREFERENCES_ITEMS } from '../bl';

export function Network() {
    const heading = 'Network';
    const description = 'Define how you will be connected with the dm3 network';

    const {
        error,
        nodes,
        deleteNode,
        isModalOpenToAddNode,
        setIsModalOpenToAddNode,
        nodeName,
        addNode,
        handleNodeNameChange,
        isProfileUpdated,
        setNodeName,
        setError,
    } = useContext(DM3UserProfileContext);

    const { updatePreferenceSelected } = useContext(ModalContext);

    // input field modal should remain close on initial load of network screen
    useEffect(() => {
        setIsModalOpenToAddNode(false);
    }, []);

    return (
        <div>
            <Heading heading={heading} description={description} />
            <div className="network">
                <div className="network-text pb-2">
                    Connected to delivery service nodes:
                </div>

                <div className="row">
                    <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12">
                        {nodes.dsNames.map((data, index) => {
                            return (
                                <div
                                    className="mt-2 ps-4 network-text d-flex"
                                    key={index}
                                >
                                    <div className="node-name">
                                        <span>{index + 1}. </span>
                                        <span>{data} </span>
                                    </div>
                                    <div>
                                        {/* Delete node option is shown only when more than 1 nodes exists */}
                                        {nodes.dsNames.length > 1 && (
                                            <img
                                                className="ms-3 pointer-cursor"
                                                src={deleteIcon}
                                                alt="remove"
                                                onClick={() => {
                                                    deleteNode(index);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!isProfileUpdated && (
                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-12 col-sm-12">
                            <span className="update-profile-box">
                                <div>
                                    {' '}
                                    Your profile configuration needs to be
                                    updated!{' '}
                                </div>
                                <u
                                    className="pointer-cursor"
                                    onClick={() =>
                                        updatePreferenceSelected(
                                            PREFERENCES_ITEMS.DM3_PROFILE,
                                        )
                                    }
                                >
                                    Update your profiles now!
                                </u>
                            </span>
                        </div>
                    )}
                </div>

                {/* Button to add new Node */}
                <div className="ms-4 mt-4">
                    <button
                        className={'node-btn'.concat(
                            ' ',
                            !isModalOpenToAddNode
                                ? 'add-node-btn-active'
                                : 'add-node-btn-disabled',
                        )}
                        disabled={isModalOpenToAddNode}
                        onClick={() => {
                            setIsModalOpenToAddNode(true);
                        }}
                    >
                        Add Node
                    </button>
                </div>

                {/* Modal to add new NODE */}
                {isModalOpenToAddNode && (
                    <div className="add-node-name-container mt-4 ms-4">
                        <div className="dm3-prof-select-type">
                            Add dm3 delivery service node
                        </div>

                        {/* Error msg container for invalid DS name */}
                        <div className="row ps-5 mt-3 mb-2 pe-5">
                            <div className="col-xl-4 col-md-4 col-sm-12 invisible">
                                <p
                                    className="m-0 
                    font-size-14 font-weight-500 line-height-24 title-content"
                                ></p>
                            </div>
                            {/* Error msg */}
                            <div className="col-xl-8 col-md-8 col-sm-12">
                                <div
                                    className={
                                        'add-name-error ms-0 font-weight-400 d-flex justify-content-start'
                                    }
                                >
                                    {error ?? ''}
                                </div>
                            </div>
                        </div>

                        <div className="row ps-5 pt-2 pe-5 pb-5">
                            <div className="col-xl-4 col-md-4 col-sm-12">
                                <p
                                    className="m-0 
                    font-size-14 font-weight-500 line-height-24 title-content"
                                >
                                    DM3 delivery service node’s name:
                                </p>
                            </div>
                            <div className="col-xl-8 col-md-8 col-sm-12">
                                <form
                                    className="d-flex width-fill align-items-center node-name-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        addNode();
                                    }}
                                >
                                    <input
                                        className={'node-name-input-field'.concat(
                                            ' ',
                                            error ? 'err-background' : '',
                                        )}
                                        type="text"
                                        value={nodeName}
                                        placeholder="Enter the ENS name of the node"
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) => handleNodeNameChange(e)}
                                    />
                                </form>
                            </div>
                        </div>

                        {/* Button to submit node name */}
                        <div className="d-flex justify-content-end add-name-btn-container">
                            <button
                                className="node-btn cancel-btn me-3"
                                onClick={() => {
                                    setNodeName('');
                                    setError(null);
                                    setIsModalOpenToAddNode(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={'node-btn'.concat(
                                    ' ',
                                    'add-node-btn-active',
                                )}
                                onClick={() => addNode()}
                            >
                                Add node
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
