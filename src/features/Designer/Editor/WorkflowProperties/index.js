import React from "react";
import PropTypes from "prop-types";
import { useMutation, queryCache } from "react-query";
import { ConfirmModal, notify, ToastNotification } from "@boomerang/carbon-addons-boomerang-react";
import WorkflowPropertiesModal from "./WorkflowPropertiesModal";
import WorkflowCloseButton from "Components/WorkflowCloseButton";
import capitalize from "lodash/capitalize";
import { serviceUrl, resolver } from "Config/servicesConfig";
import WORKFLOW_PROPERTY_UPDATE_TYPES from "Constants/workflowPropertyUpdateTypes";
import { QueryStatus } from "Constants";
import styles from "./WorkflowProperties.module.scss";

WorkflowProperties.propTypes = {
  properties: PropTypes.array.isRequired,
  workflow: PropTypes.object.isRequired,
};

const WorkflowPropertyRow = ({ title, value }) => {
  return (
    <dl className={styles.fieldContainer}>
      <dt className={styles.fieldKey}>{title}</dt>
      <dd className={styles.fieldValue}>{value}</dd>
    </dl>
  );
};

const formatDefaultValue = (value) => {
  if (!value) {
    return "---";
  } else {
    return value;
  }
};

const WorkflowPropertyHeader = ({ label, description }) => {
  return (
    <div className={styles.headerContainer}>
      <h1 className={styles.label}>{label}</h1>
      <p className={styles.description}>{formatDefaultValue(description)}</p>
    </div>
  );
};

export default function WorkflowProperties({ summaryData }) {
  const [mutateProperties, { status: mutatePropertiesStatus }] = useMutation(resolver.patchUpdateWorkflowProperties);
  const mutatePropertiesIsLoading = mutatePropertiesStatus === QueryStatus.Loading;

  const updateProperties = async ({ property, title, message, type }) => {
    let properties = [...summaryData.properties];
    if (type === WORKFLOW_PROPERTY_UPDATE_TYPES.UPDATE) {
      const propertyToUpdateIndex = properties.findIndex((currentProp) => currentProp.key === property.key);
      properties.splice(propertyToUpdateIndex, 1, property);
    }

    if (type === WORKFLOW_PROPERTY_UPDATE_TYPES.DELETE) {
      const propertyToUpdateIndex = properties.findIndex((currentProp) => currentProp.key === property.key);
      properties.splice(propertyToUpdateIndex, 1);
    }

    if (type === WORKFLOW_PROPERTY_UPDATE_TYPES.CREATE) {
      properties.push(property);
    }

    try {
      const { data } = await mutateProperties({ workflowId: summaryData.id, body: properties });
      notify(
        <ToastNotification
          kind="success"
          title={`${capitalize(type)} property`}
          subtitle={`Successfully performed operation`}
        />
      );
      queryCache.setQueryData(serviceUrl.getWorkflowSummary({ workflowId: summaryData.id }), data);
    } catch (e) {
      notify(<ToastNotification kind="error" title="Something's wrong" subtitle={`Failed to ${type} property`} />);
    }
  };

  const deleteProperty = (property) => {
    updateProperties({
      property,
      type: WORKFLOW_PROPERTY_UPDATE_TYPES.DELETE,
    });
  };

  const { properties } = summaryData;
  const propertyKeys = properties.map((input) => input.key);

  return (
    <section aria-label="Properties" className={styles.container}>
      {properties.length > 0 &&
        properties.map((property, index) => (
          <section key={`${property.id}-${index}`} className={styles.property}>
            <WorkflowPropertyHeader label={property.label} description={property.description} />
            <WorkflowPropertyRow title="Key" value={property.key} />
            <WorkflowPropertyRow title="Type" value={property.type} />
            <WorkflowPropertyRow title="Default value" value={formatDefaultValue(property.defaultValue)} />
            <WorkflowPropertyRow
              title="Options"
              value={formatDefaultValue(property.options?.map((option) => option.key).join(", "))}
            />
            {property.required ? (
              <p className={styles.required}>Required</p>
            ) : (
              <p className={styles.notRequired}>Not required</p>
            )}
            {!property.readOnly ? (
              <>
                <WorkflowPropertiesModal
                  isEdit
                  loading={mutatePropertiesIsLoading}
                  propertyKeys={propertyKeys.filter((propertyName) => propertyName !== property.key)}
                  property={property}
                  updateWorkflowProperties={updateProperties}
                />
                <ConfirmModal
                  affirmativeButtonProps={{ kind: "danger" }}
                  affirmativeAction={() => {
                    deleteProperty(property);
                  }}
                  affirmativeText="Delete"
                  negativeText="Cancel"
                  children="It will be gone. Forever."
                  title="Delete Property"
                  modalTrigger={({ openModal }) => (
                    <WorkflowCloseButton className={styles.deleteProperty} onClick={openModal} />
                  )}
                />
              </>
            ) : (
              <p className={styles.readOnlyText}>Read-only</p>
            )}
          </section>
        ))}
      <WorkflowPropertiesModal
        isEdit={false}
        propertyKeys={propertyKeys}
        updateWorkflowProperties={updateProperties}
        loading={mutatePropertiesIsLoading}
      />
    </section>
  );
}