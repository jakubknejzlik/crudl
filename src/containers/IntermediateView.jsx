import React from 'react'
import { connect } from 'react-redux'
import { autobind } from 'core-decorators'

import withViewCalls from '../utils/withViewCalls'
import Header from '../components/Header'
import { viewCallsShape } from '../PropTypes'

@autobind
class IntermediateView extends React.Component {

    static propTypes = {
        viewCalls: viewCallsShape.isRequired,
    }

    state = {
        breadcrumbs: undefined,
        returnValue: undefined,
    }

    handleProceed() {
        this.props.viewCalls.leaveView({ proceed: true, returnValue: this.state.returnValue })
    }

    handleCancel() {
        this.props.viewCalls.leaveView({ proceed: false })
    }

    render() {
        const { viewCalls: { params } } = this.props
        return (
            <main id="viewport">
                <Header breadcrumbs={params.breadcrumbs} >
                    <div className="title">
                        <h2>{params.title}</h2>
                    </div>
                </Header>
                <div id="viewport-content">
                    {params.result}
                    <div id="viewport-footer">
                        <ul role="group" className="buttons">
                            <li><button
                                type="button"
                                className="action-cancel"
                                tabIndex="0"
                                aria-label={'Cancel'}
                                onClick={this.handleCancel}
                                >{'Cancel'}</button>
                            </li>
                            <li className="opposite"><button
                                type="button"
                                className="action-proceed secondary"
                                tabIndex="0"
                                aria-label={'Proceed'}
                                onClick={this.handleProceed}
                                >{'Proceed'}</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        )
    }
}

export default connect()(withViewCalls(IntermediateView))