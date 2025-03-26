import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Divider, FormControlLabel, Typography, useTheme } from "@mui/material";


import type { HeadPr } from "@/models/PurchaseRequest";
import { formatToTwoDecimals } from "@/models/PurchaseRequest";
import Remark from "./Remark";
import PurchaseItem from "./PurchaseItem";

interface Props {
  purchaseRequests: HeadPr[];
  handleCheckboxChange: (prNo: string, type: "approve" | "wait", OBJ_REF: string, PR_REVISION: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PurchaseList = ({ purchaseRequests, handleCheckboxChange }: Props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark"; // เช็คโหมด dark หรือ light

  return (
    <>
      {purchaseRequests.map((pr, index: number) => (
        <div key={index} className="p-1 ">
          <Accordion defaultExpanded={true} className="rounded-md ">
            {/* Apply sticky to AccordionSummary */}
            <AccordionSummary
              id={`panel-header-${index}`}
              aria-controls={`panel-content-${index}`}
              className={`sticky top-16 rounded-md z-10 shadow ${isDarkMode ? ' bg-gray-800' : 'bg-[#B7E0FF]'}`} // ใช้สีพื้นหลังตามโหมดธีม

            >
              <div className="flex flex-col gap-1 w-full">
                <div className="flex flex-row gap-1 justify-between items-center w-full">
                  {/* <Typography variant="h5">PR64/30678(0)</Typography> */}
                  <Typography variant="h5">
                    {`PR${pr.PR_ID.slice(0, 2)}/${pr.PR_ID.slice(2)}(${pr.PR_REVISION})`}
                  </Typography>


                </div>

                <div>
                  {/* <Typography variant="h5">{pr.remark}</Typography> */}
                  <Remark remark={pr.PR_CMT || ""} characterLimit={50} />
                </div>
                <div className="text-end">
                  <Typography variant="h3">
                    <span className="text-green-500 font-bold">
                      {formatToTwoDecimals(pr.TOTAL_PRICE)}
                    </span>{" "}
                    <span className="font-bold text-base">
                      {pr.CURR_ID}
                    </span>
                  </Typography>
                </div>
                <div className="text-end">
                  <Typography variant="subtitle1" className="opacity-50">
                    พนักงานขอซื้อ: {pr.USER_NAME}
                  </Typography>
                </div>
                <Divider />
                <div className="flex flex-row gap-1 justify-end items-center w-full">
                  <FormControlLabel
                    label="อนุมัติ"
                    control={<Checkbox name="color-primary" color='success' size="large" />}

                    // checked={pr.APPV_FLAG === "A"}

                    checked={pr.approve}

                    onChange={() => handleCheckboxChange(pr.PR_ID, "approve", pr.OBJ_REF, pr.PR_REVISION)}
                    onClick={(event) => event.stopPropagation()} // ป้องกันการปิดเปิด Accordion
                  />
                  <FormControlLabel
                    label="รอ"
                    control={<Checkbox name="color-primary" color='warning' size="large" />}

                    checked={pr.wait}

                    // checked={pr.WAIT_FLAG === "Y"}

                    onChange={() => handleCheckboxChange(pr.PR_ID, "wait", pr.OBJ_REF, pr.PR_REVISION)}
                    onClick={(event) => event.stopPropagation()} // ป้องกันการปิดเปิด Accordion
                  />
                </div>
              </div>
            </AccordionSummary>
            <AccordionDetails  >
              {pr.child && pr.child.length > 0 && pr.child.map((item, indexItem: number) => (
                <div key={indexItem} className="flex flex-col items-end justify-start p-1 m-0  ">
                  <PurchaseItem item={item} pr={pr} />
                </div>
              ))}
            </AccordionDetails>
          </Accordion>
        </div>
      ))}
    </>
  );
};

export default PurchaseList;



