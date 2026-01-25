import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Get current authenticated user from request
 * Usage: @CurrentUser() user: User
 * Or get specific field: @CurrentUser('id') userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
