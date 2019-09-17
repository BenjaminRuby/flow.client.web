import React, { Component } from "react";
import PropTypes from "prop-types";
import Error from "@boomerang/boomerang-components/lib/Error";
import ModalContentBody from "@boomerang/boomerang-components/lib/ModalContentBody";
import ModalContentFooter from "@boomerang/boomerang-components/lib/ModalContentFooter";
import ModalConfirmButton from "@boomerang/boomerang-components/lib/ModalConfirmButton";
import { TextArea } from "@boomerang/carbon-addons-boomerang-react";

class VersionCommentForm extends Component {
  static propTypes = {
    onSave: PropTypes.func.isRequired,
    handleOnChange: PropTypes.func.isRequired,
    closeModal: PropTypes.func
  };

  state = {
    versionComment: "",
    error: false,
    saveError: false
  };

  handleOnChange = e => {
    const { value } = e.target;
    let error = false;
    if (!value || value.length > 128) {
      error = true;
    }
    this.setState(
      () => ({
        versionComment: value,
        error: error
      }),
      () => {
        this.props.shouldConfirmExit(true);
        this.props.handleOnChange(value);
      }
    );
  };

  handleOnSave = () => {
    if (!this.props.loading) {
      this.props
        .onSave()
        .then(() => {
          this.props.closeModal();
        })
        .catch(() => {
          this.setState({ saveError: true });
        });
    }
  };

  render() {
    const { loading } = this.props;

    return (
      <>
        <ModalContentBody style={{ maxWidth: "35rem", margin: "auto", height: "24rem", padding: "2rem" }}>
          {this.state.saveError ? (
            <Error theme="bmrg-flow" />
          ) : (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <TextArea
                required
                id="versionComment"
                invalid={this.state.error}
                invalidText="Value is required"
                labelText="Version comment"
                name="versionComment"
                onChange={this.handleOnChange}
                placeholder="Enter version comment"
                value={this.state.versionComment}
              />
            </div>
          )}
        </ModalContentBody>
        <ModalContentFooter>
          <ModalConfirmButton
            theme="bmrg-flow"
            text="Create"
            disabled={this.state.error || loading}
            onClick={this.handleOnSave}
          />
        </ModalContentFooter>
      </>
    );
  }
}

export default VersionCommentForm;
