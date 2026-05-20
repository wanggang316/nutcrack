import * as Icons from "@heroicons/react/24/outline";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Product icons
  CubeIcon: Icons.CubeIcon,
  // Tech icons
  CodeBracketIcon: Icons.CodeBracketIcon,
  // Dev icons
  CommandLineIcon: Icons.CommandLineIcon,
  // Tool icons
  WrenchScrewdriverIcon: Icons.WrenchScrewdriverIcon,
  // Other icons
  BookmarkIcon: Icons.BookmarkIcon,
  // Common icons
  HomeIcon: Icons.HomeIcon,
  ClockIcon: Icons.ClockIcon,
  LinkIcon: Icons.LinkIcon,
  TagIcon: Icons.TagIcon,
  UserIcon: Icons.UserIcon,
  CogIcon: Icons.CogIcon,
  DocumentIcon: Icons.DocumentIcon,
  ChartIcon: Icons.ChartBarIcon,
  HeartIcon: Icons.HeartIcon,
  StarIcon: Icons.StarIcon,
  FolderIcon: Icons.FolderIcon,
  CheckIcon: Icons.CheckIcon,
  XMarkIcon: Icons.XMarkIcon,
  PencilIcon: Icons.PencilIcon,
  TrashIcon: Icons.TrashIcon,
  ArrowDownTrayIcon: Icons.ArrowDownTrayIcon,
  ClipboardDocumentListIcon: Icons.ClipboardDocumentListIcon,
  PlusIcon: Icons.PlusIcon,
  MinusIcon: Icons.MinusIcon,
  AdjustmentsHorizontalIcon: Icons.AdjustmentsHorizontalIcon,
  BeakerIcon: Icons.BeakerIcon,
  CloudIcon: Icons.CloudIcon,
  FilmIcon: Icons.FilmIcon,
  GlobeAltIcon: Icons.GlobeAltIcon,
  HashtagIcon: Icons.HashtagIcon,
  InformationCircleIcon: Icons.InformationCircleIcon,
  LockClosedIcon: Icons.LockClosedIcon,
  MoonIcon: Icons.MoonIcon,
  MusicalNoteIcon: Icons.MusicalNoteIcon,
  NewspaperIcon: Icons.NewspaperIcon,
  PhoneIcon: Icons.PhoneIcon,
  PhotoIcon: Icons.PhotoIcon,
  PlayIcon: Icons.PlayIcon,
  RocketLaunchIcon: Icons.RocketLaunchIcon,
  ShareIcon: Icons.ShareIcon,
  ShieldCheckIcon: Icons.ShieldCheckIcon,
  SparklesIcon: Icons.SparklesIcon,
  SunIcon: Icons.SunIcon,
  SwatchIcon: Icons.SwatchIcon,
  TicketIcon: Icons.TicketIcon,
  VideoCameraIcon: Icons.VideoCameraIcon,
  WifiIcon: Icons.WifiIcon,
  GiftIcon: Icons.GiftIcon,
  TrophyIcon: Icons.TrophyIcon,
  BuildingOfficeIcon: Icons.BuildingOfficeIcon,
  AcademicCapIcon: Icons.AcademicCapIcon,
  BriefcaseIcon: Icons.BriefcaseIcon,
  CameraIcon: Icons.CameraIcon,
  ChartPieIcon: Icons.ChartPieIcon,
  CreditCardIcon: Icons.CreditCardIcon,
  CurrencyDollarIcon: Icons.CurrencyDollarIcon,
  EnvelopeIcon: Icons.EnvelopeIcon,
  KeyIcon: Icons.KeyIcon,
  MapPinIcon: Icons.MapPinIcon,
  MicrophoneIcon: Icons.MicrophoneIcon,
  PrinterIcon: Icons.PrinterIcon,
  ShoppingBagIcon: Icons.ShoppingBagIcon,
  TableCellsIcon: Icons.TableCellsIcon,
  TruckIcon: Icons.TruckIcon,
  CpuChipIcon: Icons.CpuChipIcon,
  ServerIcon: Icons.ServerIcon,
  MagnifyingGlassIcon: Icons.MagnifyingGlassIcon,
  ChevronRightIcon: Icons.ChevronRightIcon,
  ChevronLeftIcon: Icons.ChevronLeftIcon,
  ChevronDownIcon: Icons.ChevronDownIcon,
  ChevronUpIcon: Icons.ChevronUpIcon,
  ArrowsRightLeftIcon: Icons.ArrowsRightLeftIcon,
  ArrowRightOnRectangleIcon: Icons.ArrowRightOnRectangleIcon,
  Bars3Icon: Icons.Bars3Icon,
};

interface CategoryIconProps {
  iconName: string | null;
  className?: string;
}

export default function CategoryIcon({
  iconName,
  className,
}: CategoryIconProps) {
  if (!iconName) {
    return <span className={className}>📁</span>;
  }

  const IconComponent =
    iconMap[iconName] ||
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
    ];

  if (!IconComponent) {
    return <span className={className}>📁</span>;
  }

  return <IconComponent className={className} />;
}
