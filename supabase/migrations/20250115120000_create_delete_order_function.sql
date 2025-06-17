-- Create a function to safely delete an order and all its related records
CREATE OR REPLACE FUNCTION delete_order_cascade(order_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_exists BOOLEAN;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = order_uuid) INTO order_exists;
    
    IF NOT order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', order_uuid;
    END IF;

    -- Delete related records in the correct order to avoid foreign key constraint violations
    
    -- 1. Delete order notifications
    DELETE FROM order_notifications WHERE order_id = order_uuid;
    
    -- 2. Delete order status history
    DELETE FROM order_status_history WHERE order_id = order_uuid;
    
    -- 3. Delete order items
    DELETE FROM order_items WHERE order_id = order_uuid;
    
    -- 4. Finally delete the order itself
    DELETE FROM orders WHERE id = order_uuid;
    
    -- Return success
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE EXCEPTION 'Failed to delete order %: %', order_uuid, SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_order_cascade(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_order_cascade(UUID) IS 'Safely deletes an order and all its related records (notifications, status history, items) in the correct order to avoid foreign key constraint violations.';
