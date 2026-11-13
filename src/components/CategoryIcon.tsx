import {
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  Film,
  HeartPulse,
  MoreHorizontal,
  Receipt,
  ShoppingBag,
  Utensils,
  Wallet as WalletIcon,
} from "lucide-react";
import { CategoryId } from "../types/finance";

interface CategoryIconProps {
  category: CategoryId;
  className?: string;
}

export function CategoryIcon({ category, className = "w-4 h-4" }: CategoryIconProps) {
  switch (category) {
    case "makan":
      return <Utensils className={className} />;
    case "kopi":
      return <Coffee className={className} />;
    case "transport":
      return <Car className={className} />;
    case "belanja":
      return <ShoppingBag className={className} />;
    case "tagihan":
      return <Receipt className={className} />;
    case "hiburan":
      return <Film className={className} />;
    case "kesehatan":
      return <HeartPulse className={className} />;
    case "pendidikan":
      return <BookOpen className={className} />;
    case "gaji":
      return <WalletIcon className={className} />;
    case "freelance":
      return <Briefcase className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
}
