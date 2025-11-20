export const searchFilter = (search: string | null, type: string | null) => {
  if (!search && !type) {
    return undefined;
  }

  const filters: any = {};

  if (search) {
    filters.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type) {
    filters.postType = { contains: type, mode: "insensitive" };
  }

  return filters;
};

export const userFilter = (user: string | null) => {
  if (!user) {
    return undefined;
  }

  const filters: any = {};

  if (user) {
    filters.OR = [
      { firstName: { contains: user, mode: "insensitive" } },
      { lastName: { contains: user, mode: "insensitive" } },
    ];
  }

  return filters;
};
