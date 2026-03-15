import { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";

interface PageCardProps {
  title: string;
  to?: string;
  children?: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}

export function PageCard({ title, to, children, onClick, icon }: PageCardProps) {
  const cardContent = (
    <motion.div
      className="bg-card border border-primary/40 p-8 hover:border-primary transition-all cursor-pointer h-full relative group overflow-hidden"
      whileHover={{
        boxShadow: "0 0 20px rgba(0, 207, 255, 0.3), inset 0 0 20px rgba(0, 207, 255, 0.1)"
      }}
    >
      {icon && (
        <motion.div
          className="mb-4 text-primary"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      )}

      <h3 className="mb-4 uppercase tracking-wider text-primary group-hover:text-white transition-colors header-font">
        {title}
      </h3>
      <div className="code-font text-sm">{children}</div>
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className="h-full">
      {cardContent}
    </div>
  );
}
