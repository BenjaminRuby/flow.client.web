import React from "react";
import PropTypes from "prop-types";
import ReactJson from "react-json-view";
import { ComposedModal, ModalForm } from "@boomerang/carbon-addons-boomerang-react";
import { ModalBody, Tabs, Tab } from "@boomerang/carbon-addons-boomerang-react";
import PropertiesTable from "./PropertiesTable";
import styles from "./outputPropertisLog.module.scss";

function OutputPropertiesLog({ flowTaskName, flowTaskOutputs }) {
  let arrayProps = [];
  Object.keys(flowTaskOutputs).forEach(
    (val, index) =>
      (arrayProps = arrayProps.concat({
        id: `${val}-${index}`,
        key: val,
        value: JSON.stringify(flowTaskOutputs[val], null, 2),
      }))
  );

  return (
    <ComposedModal
      composedModalProps={{ containerClassName: styles.container, shouldCloseOnOverlayClick: true }}
      confirmModalProps={{
        title: "Are you sure?",
        children: "Your changes will not be saved",
      }}
      modalHeaderProps={{
        title: "Output Properties",
        label: `${flowTaskName}`,
      }}
      modalTrigger={({ openModal }) => (
        <button className={styles.trigger} onClick={openModal}>
          View Properties
        </button>
      )}
    >
      {() => (
        <ModalForm>
          <ModalBody>
            <Tabs>
              <Tab label="Table">
                <PropertiesTable data={arrayProps} />
              </Tab>
              <Tab label="JSON">
                <div className={styles.propertiesJson}>
                  <ReactJson
                    name={false}
                    src={flowTaskOutputs}
                    displayDataTypes={false}
                    enableDelete={false}
                    displayObjectSize={false}
                    enableEdit={false}
                    enableAdd={false}
                  />
                </div>
              </Tab>
            </Tabs>
          </ModalBody>
        </ModalForm>
      )}
    </ComposedModal>
  );
}

OutputPropertiesLog.propTypes = {
  flowTaskName: PropTypes.string.isRequired,
  flowTaskOutputs: PropTypes.object.isRequired,
};

export default OutputPropertiesLog;
