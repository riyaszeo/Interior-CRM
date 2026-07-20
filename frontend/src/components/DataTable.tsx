import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  TableSortLabel,
  CircularProgress,
  Divider
} from '@mui/material';

export interface ColumnDefinition {
  field: string;
  headerName: string;
  sortable?: boolean;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: ColumnDefinition[];
  rows: any[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  loading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  sortField,
  sortOrder,
  onSort,
  loading = false,
}) => {
  const handlePageChange = (_event: unknown, newPage: number) => {
    // MUI uses 0-indexed page, our backend is 1-indexed
    onPageChange(newPage + 1);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  return (
    <Paper 
      sx={{ 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: 4, 
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'none',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
      }}
    >
      <TableContainer sx={{ minHeight: 340, position: 'relative' }}>
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              bgcolor: 'rgba(0, 0, 0, 0.05)', 
              zIndex: 1 
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}

        <Table stickyHeader sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align="left"
                  sx={{ 
                    fontWeight: 700, 
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                    py: 2
                  }}
                >
                  {column.sortable && onSort ? (
                    <TableSortLabel
                      active={sortField === column.field}
                      direction={sortField === column.field ? sortOrder : 'asc'}
                      onClick={() => onSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No matching records found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow 
                  hover 
                  key={row.id || index}
                  sx={{ 
                    '&:last-child cell': { border: 0 },
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column.field} 
                      align="left" 
                      sx={{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      {column.render ? column.render(row) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ opacity: 0.1 }} />

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={pagination.total}
        rowsPerPage={pagination.per_page}
        // MUI uses 0-indexed pages
        page={Math.max(0, pagination.current_page - 1)}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sx={{
          bgcolor: 'background.paper',
          color: 'text.secondary',
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontWeight: 600,
            fontSize: '0.825rem'
          }
        }}
      />
    </Paper>
  );
};
