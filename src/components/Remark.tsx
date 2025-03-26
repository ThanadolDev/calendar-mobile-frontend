import { useState } from "react";

import { Button, Typography } from "@mui/material";

const Remark = ({ remark, characterLimit }: { remark: string; characterLimit: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Stop the event from propagating to the Accordion
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <Typography variant="h5" component="span">
        {isExpanded || remark.length <= characterLimit
          ? remark
          : `${remark.slice(0, characterLimit)}`}
        {remark.length > characterLimit && !isExpanded && (
          <>
            <span>... </span>
            <Button
              size="small"
              color="primary"
              variant="text"
              onClick={toggleExpansion}
              style={{ paddingLeft: 0, textTransform: "none" }} // to ensure the button is inline
            >
              อ่านเพิ่มเติม
            </Button>
          </>
        )}
      </Typography>
      {isExpanded && remark.length > characterLimit && (
        <Button
          size="small"
          color="primary"
          variant="text"
          onClick={toggleExpansion}
        >
          ย่อข้อความ
        </Button>
      )}
    </div>
  );
};

export default Remark;
