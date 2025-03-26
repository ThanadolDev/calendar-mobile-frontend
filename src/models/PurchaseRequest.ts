import moment from "moment";
import 'moment/locale/th'; // Import Thai locale

// models/PurchaseRequest.ts
export interface HeadPr {
  PR_ID: string;
  OBJ_REF: string;
  PR_REVISION: string;
  USER_ID: string;
  WAIT_FLAG: string;
  INFORM_ID: string;
  STOCK_FLAG: string;
  CMNT_FLAG: string;
  USER_NAME: string;
  PR_CMT: string;
  CURR_ID: string;
  RATE: string;
  ADV_PERSON: string;
  ADV_NAME: string;
  child: PRDetails[];
  TOTAL_PRICE: number;
  CURR_UNIT: number;
  APPV_FLAG: string;
  WAIT_LOG: string;
  approve: boolean;
  wait: boolean;
  genId: string;
}

export interface PRDetails {
  PR_ID: string;
  PR_REVISION: string;
  PR_SEQ: string;
  MAT_ID: string;
  BT_PO: string;
  REQ_NUM: string;
  PR_MAT_CMT: string;
  APPV_FLAG: string;
  MAT_NAME: string;
  UNIT_PO: string;
  PIC_COUNT: string;
  DOC_COUNT: string;
  PREPARE_FLAG: string;
  FIRST_DELI_DATE: string;
  INFORM_DESC: string;
  PRICE: number;
  DISC: string;
  WAIT_LOG: string;
  CURR_RATE: string;
  PR_UNIT: string;
  PR_MACH: string;
  UNIT_PRICE: number;
  AMOUNT: number;
  SUM_BETWEEN_PR: number;
  genId: string;
}

export const calculateTotalValueSelected = (CURR_ID: string, data: HeadPr[]) => {
  const value = data
    .filter(pr => pr.approve && pr.CURR_ID === CURR_ID)
    .reduce((acc, pr) => acc + pr.TOTAL_PRICE, 0)

  return value
}

export const formatToTwoDecimals = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatToTwoDecimalsNoComma = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false, // Disable thousands separator (comma)
  }).format(value);
};

// Create a function to format date in Thai locale
export const formatDateInThai = (date: string | Date) => {
  moment.locale('th'); // Set Thai locale

  return moment(date).format('ll'); // Format date in 'LL' format
};

