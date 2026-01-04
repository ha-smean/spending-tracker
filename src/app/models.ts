// export type Transaction = {
//   id: string;
//   date: string;
//   description: string;
//   amount: number;
//   category: string;
// };

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;      // always positive
  category: string;
  type: "income" | "expense";
};


export type Category = {
  name: string;
  color: string;
};
