import React, { useState } from "react";
import { ModalContentBody, ModalContentFooter, ModalConfirmButton } from "@boomerang/boomerang-components";
import { AutoSuggestTextArea } from "@boomerang/boomerang-components";
import AutoSuggest from "Components/AutoSuggest";
import formatAutoSuggestProperties from "Utilities/formatAutoSuggestProperties";

const TextAreaView = props => {
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState({});
  const [field, setField] = useState("");

  const closeModal = () => {
    props.setTextAreaValue(value);
    props.onSelectTextInputChange(value, errors, field);
    props.closeModal.call();
  };

  const saveValue = (value, errors, field) => {
    setValue(value);
    setErrors(errors);
    setField(field);
  };

  return (
    <>
      <ModalContentBody
        style={{
          maxWidth: "35rem",
          height: "26rem",
          width: "100%",
          margin: "auto",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start"
        }}
      >
        <AutoSuggest
          autoSuggestions={formatAutoSuggestProperties(props.inputProperties)}
          handleChange={saveValue}
          initialValue={props.inputs[props.item.key] || ""}
          inputProps={{
            placeholder: props.item.description,
            alwaysShowTitle: true,
            type: props.itemConfig.type,
            theme: "bmrg-white"
          }}
          name={props.item.key}
          theme="bmrg-white"
          validationFunction={value =>
            props.validateInput({
              value,
              maxValueLength: props.maxValueLength,
              minValueLength: props.minValueLength,
              validationFunction: props.itemConfig.validationFunction,
              validationText: props.itemConfig.validationText
            })
          }
        >
          <AutoSuggestTextArea style={{ height: "23rem", resize: "none" }} />
        </AutoSuggest>
      </ModalContentBody>
      <ModalContentFooter>
        <ModalConfirmButton text="UPDATE" onClick={closeModal} theme="bmrg-white" />
      </ModalContentFooter>
    </>
  );
};

export default TextAreaView;
