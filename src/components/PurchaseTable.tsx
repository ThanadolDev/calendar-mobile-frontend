// 'use client';
// import * as React from 'react';

// import Box from '@mui/material/Box';
// import Collapse from '@mui/material/Collapse';
// import IconButton from '@mui/material/IconButton';
// import Table from '@mui/material/Table';
// import TableBody from '@mui/material/TableBody';
// import TableCell from '@mui/material/TableCell';
// import TableContainer from '@mui/material/TableContainer';
// import TableHead from '@mui/material/TableHead';
// import TableRow from '@mui/material/TableRow';
// import Typography from '@mui/material/Typography';
// import Paper from '@mui/material/Paper';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
// import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// import { Checkbox, FormControlLabel } from '@mui/material';


// interface Props {
//   purchaseRequests: PurchaseRequest[];
//   handleCheckboxChange: (prNo: string, type: "approve" | "wait") => void;
// }

// export default function PurchaseTable({ purchaseRequests, handleCheckboxChange }: Props) {
//   return (
//     <TableContainer component={Paper}>
//       <Table aria-label="collapsible table" stickyHeader  >
//         <TableHead>
//           <TableRow>
//             <TableCell />
//             <TableCell>PR No</TableCell>
//             <TableCell>PR Date</TableCell>
//             <TableCell>Issuer</TableCell>
//             <TableCell>แผนก</TableCell>
//             <TableCell align="right">มูลค่า PR</TableCell>
//             <TableCell>Remark</TableCell>
//             <TableCell />
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {purchaseRequests.map((pr, index: number) => (
//             <Row key={index} purchaseRequest={pr} handleCheckboxChange={handleCheckboxChange} />
//           ))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );
// }

// interface RowProps {
//   purchaseRequest: PurchaseRequest;
//   handleCheckboxChange: (prNo: string, type: "approve" | "wait") => void;
// }

// function Row({ purchaseRequest, handleCheckboxChange }: RowProps) {
//   const { prNo, prDate, issuer, department, totalValue, remark, items } = purchaseRequest;
//   const [open, setOpen] = React.useState(false);

//   return (
//     <React.Fragment>
//       <TableRow>
//         <TableCell>
//           <FormControlLabel label='อนุมัติ'
//             control={<Checkbox defaultChecked name='color-primary' />}
//             checked={purchaseRequest.approve}

//             onChange={() => {
//               handleCheckboxChange(purchaseRequest.prNo, "approve")
//             }}
//           />
//           <FormControlLabel label='รอ'
//             control={<Checkbox defaultChecked name='color-primary' />}
//             checked={purchaseRequest.wait}

//             onChange={() => {
//               handleCheckboxChange(purchaseRequest.prNo, "wait")
//             }}
//           />
//         </TableCell>
//         <TableCell>{prNo}</TableCell>
//         <TableCell>{prDate}</TableCell>
//         <TableCell>{issuer}</TableCell>
//         <TableCell>{department}</TableCell>
//         <TableCell align="right">{formatToTwoDecimals(totalValue)}</TableCell>
//         <TableCell>{remark}</TableCell>
//         <TableCell>
//           <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
//             {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
//           </IconButton>
//         </TableCell>
//       </TableRow>

//       {/* Details section */}
//       <TableRow >
//         <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8} >
//           <Collapse in={open} timeout="auto" unmountOnExit>
//             <Box sx={{ margin: 1 }}>
//               <Typography variant="h6" gutterBottom component="div">
//                 PR Document Details
//               </Typography>
//               <Table size="small" aria-label="items" className='' stickyHeader>
//                 <TableHead >
//                   <TableRow>
//                     <TableCell className='border '>รหัสวัตถุดิบ</TableCell>
//                     <TableCell className='border'>Description</TableCell>
//                     <TableCell className='border' align="right">ราคาต่อหน่วย</TableCell>
//                     <TableCell className='border' align="right">Units</TableCell>
//                     <TableCell className='border'>Unit Description</TableCell>
//                     <TableCell className='border' align="right">ราคาสุทธิ (บาท)</TableCell>
//                     <TableCell className='border'>Department</TableCell>
//                     <TableCell className='border'>Machine No</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {items.map((item: PRItem, index: number) => (
//                     <TableRow key={index}>
//                       <TableCell className='border'>{item.itemNo}</TableCell>
//                       <TableCell className='border'>{item.description}</TableCell>
//                       <TableCell className='border' align="right">{formatToTwoDecimals(item.unitPrice)}</TableCell>
//                       <TableCell className='border' align="right">{item.noOfUnits}</TableCell>
//                       <TableCell className='border'>{item.unitDescription}</TableCell>
//                       <TableCell className='border' align="right">{formatToTwoDecimals(item.itemValue)}</TableCell>
//                       <TableCell className='border'>{item.department}</TableCell>
//                       <TableCell className='border'>{item.machineNo}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </Box>
//           </Collapse>
//         </TableCell>
//       </TableRow>
//     </React.Fragment>
//   );
// }
