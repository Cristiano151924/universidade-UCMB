import Image from "next/image";

// A imagem da logo já tem o fundo cinza da marca (#b8bcbf): use sobre uma faixa dessa cor.
export default function Logo({ className = "h-12 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/logo-ucmb.png"
      alt="UCMB - Universidade Corporativa Mais Barato"
      width={1911}
      height={415}
      className={className}
      priority
    />
  );
}
